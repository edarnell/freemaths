del server\storage\emails\*.*
del server\storage\error.log
echo "Test Run" > server\storage\error.log
npx cypress run --record --key 86c27018-2cda-4930-824c-7c51029a2cf9

