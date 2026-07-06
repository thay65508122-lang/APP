FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN mkdir -p /app/data
ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/joyeria.db
EXPOSE 3000
CMD ["node", "server.js"]