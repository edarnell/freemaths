copy .\server\storage\*.gz .\server\storage\diff
scp -i ../.ssh/epdarnell.pem ubuntu@ec2.freemaths.uk:/var/www/freemaths/storage/*.gz .\server\storage
