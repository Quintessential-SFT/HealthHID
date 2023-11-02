#!/bin/sh

cd src
nodemon --watch . --exec 'http-server -p 3000'

