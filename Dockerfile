FROM node:12

# Install gulp and pm2 globaly
RUN npm install --quiet -g gulp pm2

# define Environment variable to build image
ENV NODE_ENV='prod'
ENV SERVER_PORT='3000'
ENV LOG_PATH='/home/logs'


# Create app directory
RUN mkdir -p /usr/src/

WORKDIR /usr/src/

# Install app dependencies
COPY package*.json /usr/src/

RUN npm install --quiet

# Bundle app source
COPY . /usr/src

# Build the project
RUN npm run build

WORKDIR /usr/src/dist/

EXPOSE 3000
CMD ["node", "app.js"]
