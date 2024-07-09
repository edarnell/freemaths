scp -i ../.ssh/epdarnell.pem ubuntu@ec2.freemaths.uk:/var/www/freemaths/storage/*.gz server/storage/live
scp -i ../.ssh/epdarnell.pem ubuntu@ec2.freemaths.uk:/var/www/freemaths2/storage/*.gz server/storage/beta
echo cp server/storage/*.gz server/storage/diff