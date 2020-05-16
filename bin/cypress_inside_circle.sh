#! /bin/bash

set -e

if [ `basename $(pwd)` != "togetherness" ]; then
  echo "You must be in the togetherness directory to run this command"
  exit 1
fi

echo > package.json <<EOF
{
  "dependencies" : {
    "wait-on": "*"
  }
}
EOF

npm install


echo "Starting the server"

python2 -m SimpleHTTPServer 80 & wait-on http://localhost:80

echo "Starting cypress"

cypress run


