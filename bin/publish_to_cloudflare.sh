#! /bin/bash


echo "copy ./src/ r2:apps-1kfa-com/table/"
rclone copy ./src/ r2:apps-1kfa-com/table/

cd src

echo "rclone copy ./deckahedron/ r2:apps-1kfa-com/deckahedron/"
rclone copy ./deckahedron/ r2:apps-1kfa-com/deckahedron/
echo "rclone copy ./svg/ r2:apps-1kfa-com/svg/"
rclone copy ./svg/ r2:apps-1kfa-com/svg/
echo "rclone copy ./img/ r2:apps-1kfa-com/img/"
rclone copy ./img/ r2:apps-1kfa-com/img/
