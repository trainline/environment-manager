---
title: Server app
layout: docs
weight: 50
---

### Installation

To get the Environment Manager project, simply run:
```
git clone https://github.com/trainline/environment-manager.git
```

To run server:
```
cd server/
npm install
sudo npm install -g bower gulp
cd ../client && bower install
cd ../server
npm start
```

Also, for local development you can run process with `nodemon`:
```
npm install -g nodemon
npm run dev
```

To create a zip package in `dist/` folder with built app:
```
cd client
npm install && gulp build-server
```

### Configuring your environment
Configuration values are loaded in the following order to allow fine-grained control of overrides:

- Environment variables
- Arguments passed at startup
- A given `profile` path

It's recommended that all values are set at an environment level when running in production.

Values are:

- **EM_AWS_REGION**:        The target AWS region  
- **EM_AWS_S3_BUCKET**:     S3 bucket configuration  
- **EM_AWS_S3_KEY**:        S3 key file  
- **EM_AWS_RESOURCE_PREFIX**:   DynamoDB table prefix for instance isolation  
- **EM_LOG_LEVEL**:         Log output level  
- **NODE_ENV**: App environment. Needs to be set to **production** on production
- **USE_HTTP**: Use HTTP on production server (default is HTTPS)


#### Required values
As minimum you must specify a value for  

- **EM_AWS_REGION**  

In production you must also specify values for  

- **EM_AWS_S3_BUCKET**  
- **EM_AWS_S3_KEY**  

#### Startup arguments
Any value can be overridden at startup via a CLI argument, for example:

```
npm start --EM_AWS_REGION ap-south-1
```

#### Loading a configuration profile
A configuration file can be used to override multiple values (useful for testing). To load a profile, provide an `EM_PROFILE` value at startup that points to a file containing your overrides:

```
npm start --EM_PROFILE test/test-profile.json
```

#### Default values
Default settings are configured for some values if they are not set by either environmenmt, argument or profile. These are:

- **EM_AWS_RESOURCE_PREFIX**: Default value is _empty string_  
- **EM_LOG_LEVEL**: Default value is _debug_