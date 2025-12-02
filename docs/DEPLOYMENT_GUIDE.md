🚀 วิธี Deploy บน Localhost
สร้าง Dockerfile ให้แล้ว ตอนนี้รันคำสั่งเหล่านี้:
1. Build Docker Image
docker build -t safe-gpt-next .
2. Run Container
docker run -d \
  --name safe-gpt-next \
  -p 3000:3000 \
  safe-gpt-next
3. เปิดบราวเซอร์
http://localhost:3000
4. ดู Logs
docker logs safe-gpt-next -f
คำสั่งที่เป็นประโยชน์:
# Stop container
docker stop safe-gpt-next

# Start container
docker start safe-gpt-next

# Restart container
docker restart safe-gpt-next

# Remove container
docker rm -f safe-gpt-next

# Remove image
docker rmi safe-gpt-next

# Rebuild (หลังแก้ code)
docker build -t safe-gpt-next .
docker rm -f safe-gpt-next
docker run -d --name safe-gpt-next -p 3000:3000 safe-gpt-next
เท่านี้ครับ! เรียบง่าย ไม่มีอะไรเพิ่ม 🎯