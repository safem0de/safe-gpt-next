# Security Guide: Chat API Protection

## ภาพรวม

เอกสารนี้อธิบายการป้องกันช่องโหว่ด้านความปลอดภัยในระบบ Chat API ที่ป้องกันไม่ให้ผู้ใช้สามารถเข้าถึง แก้ไข หรือลบ chat ของผู้ใช้อื่นได้

## ช่องโหว่ที่พบและแก้ไข

### 1. **Chat History Leakage** (ข้อมูล chat รั่วไหลระหว่างผู้ใช้)

**ปัญหา**: ผู้ใช้สามารถเห็น chat history ของผู้ใช้อื่นใน Sidebar ได้

**สาเหตุ**: API endpoints ไม่มีการตรวจสอบ ownership และ authentication

**วิธีแก้ไข**: เพิ่มการตรวจสอบ authentication และ ownership ในทุก endpoints

---

## Architecture

### Authentication Helper Functions

สร้างไฟล์ `src/utils/auth-helper.ts` เพื่อจัดการ authentication:

```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

/**
 * Get authenticated user from session
 * @returns User ID (email or name) if authenticated, null otherwise
 */
export async function getAuthenticatedUser(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return null;
    }

    // Use email as primary identifier, fallback to name
    const userId = session.user.email || session.user.name;

    if (!userId) {
      return null;
    }

    return userId;
  } catch (error) {
    console.error("Error getting authenticated user:", error);
    return null;
  }
}

/**
 * Require authentication - returns 401 if not authenticated
 * @returns User ID if authenticated, or NextResponse with 401 error
 */
export async function requireAuth(): Promise<string | NextResponse> {
  const userId = await getAuthenticatedUser();

  if (!userId) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized - Please sign in",
        code: "UNAUTHORIZED",
      },
      { status: 401 }
    );
  }

  return userId;
}

/**
 * Check if user is authenticated
 * @returns true if authenticated, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  const userId = await getAuthenticatedUser();
  return userId !== null;
}
```

---

## Protected Endpoints

### 1. GET `/api/chats/[id]` - ดึงข้อมูล chat เดียว

**การป้องกัน**:
- ✅ ตรวจสอบ authentication
- ✅ ตรวจสอบ ownership (ป้องกันการเข้าถึง chat ของผู้อื่น)
- ✅ Log security warnings

```typescript
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    // ✅ Require authentication
    const userIdOrError = await requireAuth();
    if (userIdOrError instanceof NextResponse) {
        return userIdOrError; // Return 401 error
    }
    const userId = userIdOrError;

    try {
        await connectDB();

        const chat = await Chat.findById(id);

        if (!chat) {
            return NextResponse.json(
                { success: false, error: "Chat not found", code: "NOT_FOUND" },
                { status: 404 }
            );
        }

        // ✅ Check ownership - prevent accessing other users' chats
        if (chat.userId !== userId) {
            console.warn(`🚨 SECURITY: User ${userId} attempted to access chat ${id} owned by ${chat.userId}`);
            return NextResponse.json(
                {
                    success: false,
                    error: "Access denied - You don't have permission to view this chat",
                    code: "FORBIDDEN",
                },
                { status: 403 }
            );
        }

        return NextResponse.json({ success: true, chat });
    } catch (err: any) {
        console.error(`Error in GET /api/chats/${id}:`, err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
```

---

### 2. DELETE `/api/chats/[id]` - ลบ chat

**การป้องกัน**:
- ✅ ตรวจสอบ authentication
- ✅ ตรวจสอบ ownership (ป้องกันการลบ chat ของผู้อื่น)
- ✅ Log security warnings

```typescript
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    // ✅ Require authentication
    const userIdOrError = await requireAuth();
    if (userIdOrError instanceof NextResponse) {
        return userIdOrError; // Return 401 error
    }
    const userId = userIdOrError;

    try {
        await connectDB();

        const chat = await Chat.findById(id);

        if (!chat) {
            return NextResponse.json(
                { success: false, error: "Chat not found", code: "NOT_FOUND" },
                { status: 404 }
            );
        }

        // ✅ Check ownership - prevent deleting other users' chats
        if (chat.userId !== userId) {
            console.warn(`🚨 SECURITY: User ${userId} attempted to delete chat ${id} owned by ${chat.userId}`);
            return NextResponse.json(
                {
                    success: false,
                    error: "Access denied - You don't have permission to delete this chat",
                    code: "FORBIDDEN",
                },
                { status: 403 }
            );
        }

        await Chat.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error(`Error in DELETE /api/chats/${id}:`, err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
```

---

### 3. POST `/api/chats` - สร้างหรืออัปเดต chat

**การป้องกัน**:
- ✅ ตรวจสอบ authentication
- ✅ ตรวจสอบ ownership เมื่ออัปเดต (ป้องกันการแก้ไข chat ของผู้อื่น)
- ✅ ตรวจสอบ userId ตรงกับผู้ใช้ที่ authenticated เมื่อสร้างใหม่
- ✅ Log security warnings

```typescript
export async function POST(req: NextRequest) {
    // ✅ Require authentication
    const userIdOrError = await requireAuth();
    if (userIdOrError instanceof NextResponse) {
        return userIdOrError; // Return 401 error
    }
    const authenticatedUserId = userIdOrError;

    try {
        await connectDB();
        const { _id, userId, title, messages } = await req.json();

        let chat;

        if (_id) {
            // อัปเดตข้อความและเวลา
            // ✅ Check ownership before update
            const existingChat = await Chat.findById(_id);

            if (!existingChat) {
                return NextResponse.json(
                    { success: false, error: "Chat not found", code: "NOT_FOUND" },
                    { status: 404 }
                );
            }

            if (existingChat.userId !== authenticatedUserId) {
                console.warn(`🚨 SECURITY: User ${authenticatedUserId} attempted to update chat ${_id} owned by ${existingChat.userId}`);
                return NextResponse.json(
                    {
                        success: false,
                        error: "Access denied - You don't have permission to update this chat",
                        code: "FORBIDDEN",
                    },
                    { status: 403 }
                );
            }

            chat = await Chat.findByIdAndUpdate(
                _id,
                {
                    $set: {
                        messages,
                        updatedAt: new Date(),
                    }
                },
                { new: true }
            );
        } else {
            // สร้างใหม่
            // ✅ Ensure userId from request matches authenticated user
            if (userId !== authenticatedUserId) {
                console.warn(`🚨 SECURITY: User ${authenticatedUserId} attempted to create chat for ${userId}`);
                return NextResponse.json(
                    {
                        success: false,
                        error: "Access denied - Cannot create chat for another user",
                        code: "FORBIDDEN",
                    },
                    { status: 403 }
                );
            }

            const createdate_text = new Date().toLocaleString("th-TH", { dateStyle: "long", timeStyle: "short" });
            chat = await Chat.create({
                userId: authenticatedUserId, // Use authenticated userId
                messages,
                title: title ?? (messages?.[0]?.content?.[0]?.text ?? `สวัสดี ${createdate_text}`),
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }

        return NextResponse.json({ success: true, chat });
    } catch (err: any) {
        console.error("Error in POST /api/chats:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
```

---

### 4. GET `/api/chats` - ดึงรายการ chat ทั้งหมด

**การป้องกัน**:
- ✅ ตรวจสอบ authentication
- ✅ ตรวจสอบ userId ที่ส่งมาต้องตรงกับผู้ใช้ที่ authenticated
- ✅ บังคับให้ query เฉพาะ chat ของตัวเอง
- ✅ Log security warnings

```typescript
export async function GET(req: NextRequest) {
    // ✅ Require authentication
    const userIdOrError = await requireAuth();
    if (userIdOrError instanceof NextResponse) {
        return userIdOrError; // Return 401 error
    }
    const authenticatedUserId = userIdOrError;

    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const requestedUserId = searchParams.get('userId');

        // ✅ Check ownership - only allow users to fetch their own chats
        if (requestedUserId && requestedUserId !== authenticatedUserId) {
            console.warn(`🚨 SECURITY: User ${authenticatedUserId} attempted to fetch chats for ${requestedUserId}`);
            return NextResponse.json(
                {
                    success: false,
                    error: "Access denied - You can only view your own chats",
                    code: "FORBIDDEN",
                },
                { status: 403 }
            );
        }

        // ✅ Always filter by authenticated user ID
        const chats = await Chat.find({ userId: authenticatedUserId }).sort({ updatedAt: -1 });
        console.log("DEBUG chats for userId", authenticatedUserId, ":", chats);

        return NextResponse.json({ success: true, chats });
    } catch (err: any) {
        console.error("GET /api/chats error:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
```

---

## HTTP Status Codes

| Code | ความหมาย | เมื่อใช้ |
|------|----------|----------|
| 200 | OK | Request สำเร็จ |
| 401 | Unauthorized | ยังไม่ได้ login |
| 403 | Forbidden | Login แล้วแต่ไม่มีสิทธิ์เข้าถึง resource นี้ |
| 404 | Not Found | ไม่พบข้อมูลที่ต้องการ |
| 500 | Internal Server Error | Error ที่ไม่คาดคิด |

---

## Error Response Format

```json
{
  "success": false,
  "error": "Access denied - You don't have permission to view this chat",
  "code": "FORBIDDEN"
}
```

**Error Codes**:
- `UNAUTHORIZED` - ยังไม่ได้ login
- `FORBIDDEN` - ไม่มีสิทธิ์เข้าถึง
- `NOT_FOUND` - ไม่พบข้อมูล

---

## Security Logging

ทุก security event จะถูก log ไว้ที่ console:

```typescript
console.warn(`🚨 SECURITY: User ${userId} attempted to access chat ${id} owned by ${chat.userId}`);
```

**ควรทำ** เมื่อ production:
1. ส่ง logs ไปที่ monitoring service (เช่น Sentry, DataDog)
2. ตั้ง alerts เมื่อมี unauthorized access attempts
3. เก็บ audit logs สำหรับ compliance

---

## Testing Security

### ทดสอบด้วย User 2 คน

1. Login ด้วย User A → สร้าง chat
2. Login ด้วย User B → พยายามเข้าถึง chat ของ User A

**ควรได้ผลลัพธ์**:
- GET `/api/chats/[chatA_id]` → 403 Forbidden
- DELETE `/api/chats/[chatA_id]` → 403 Forbidden
- POST `/api/chats` with `_id=chatA_id` → 403 Forbidden
- GET `/api/chats?userId=userA@email.com` → 403 Forbidden

### ทดสอบโดยไม่ login

1. ไม่ login → พยายามเรียก API

**ควรได้ผลลัพธ์**:
- ทุก endpoints → 401 Unauthorized

---

## Best Practices

### 1. Always Validate User Identity
```typescript
const userIdOrError = await requireAuth();
if (userIdOrError instanceof NextResponse) {
    return userIdOrError;
}
const userId = userIdOrError;
```

### 2. Check Ownership Before Modifications
```typescript
if (chat.userId !== userId) {
    console.warn(`🚨 SECURITY: Unauthorized access attempt`);
    return NextResponse.json(
        { success: false, error: "Access denied", code: "FORBIDDEN" },
        { status: 403 }
    );
}
```

### 3. Use Server-Side Session
```typescript
const session = await getServerSession(authOptions);
```

**ห้าม** ใช้ client-side session เพราะสามารถ manipulate ได้

### 4. Trust Server, Not Client
```typescript
// ❌ ไม่ดี - trust userId from request
const { userId } = await req.json();
const chats = await Chat.find({ userId });

// ✅ ดี - use authenticated userId
const authenticatedUserId = await requireAuth();
const chats = await Chat.find({ userId: authenticatedUserId });
```

### 5. Log Security Events
```typescript
console.warn(`🚨 SECURITY: User ${userId} attempted to access chat ${id} owned by ${chat.userId}`);
```

---

## สรุป

การแก้ไขนี้ป้องกัน:
- ✅ Chat history leakage ระหว่าง users
- ✅ Unauthorized access to chats
- ✅ Unauthorized modifications
- ✅ Unauthorized deletions
- ✅ Creating chats for other users

**การเปลี่ยนแปลงหลัก**:
1. สร้าง `auth-helper.ts` สำหรับ authentication utilities
2. เพิ่ม authentication checks ในทุก endpoints
3. เพิ่ม ownership validation
4. เพิ่ม security logging
5. Standardize error responses

---

## ไฟล์ที่เกี่ยวข้อง

- [src/utils/auth-helper.ts](../src/utils/auth-helper.ts) - Authentication utilities
- [src/app/api/chats/[id]/route.ts](../src/app/api/chats/[id]/route.ts) - Single chat endpoints
- [src/app/api/chats/route.ts](../src/app/api/chats/route.ts) - Chat list endpoints
- [src/app/api/auth/[...nextauth]/route.ts](../src/app/api/auth/[...nextauth]/route.ts) - NextAuth configuration
