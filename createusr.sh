#!/bin/bash
adduser  --disabled-password --gecos '' $1 
chown -R $1:$1 ./$2 
id -u $1
