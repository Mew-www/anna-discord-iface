# Written on Node v10
FROM node:10

# Create workdir
WORKDIR /usr/app

# Copy dependency refs and install them (less prone to change than source code)
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Run code (no compilation necessary)
CMD ["node", "discord-iface.js"]

