# This is README file

This is a project for School Management System. This is the API part. 
For running this project Clone is form the repository and run

`npm install`

You need a mongo database to run this app. If you do not have a database then create a database in mongodb named **School**. Running the script **sample_database_builder.js** in test directory populate your database with some dummy accounts. To run the script run 

`node test/sample_database_builder.js`

This will install all the packages.

This README will get it's form with the progressive development of the project.   


## Used node modules

* expressjs => application Frame work
* body-parser  => handling jsons in GET/POST/PUT/DELETE requests
* mongoose => mongoBD database handler
* brypt => encryption mechanisom 
* winston => logger
* hat =>  Random token generator
* password-hash => Encript password

## API Documentation


### Authentication: 
Upon login, front-end will send a POST message to server at address **/api/authenticate** containing the data ```{email: 'email@address.com', password: 'secret password'}```. This request can be simulated with following curl request.

``` bash
curl -X POST --data "email=admin@demo.com&password=123456" http://localhost:5000/api/authenticate
```
The if email password combination is valid then the reposne will be 
``` json
{"status":200,"id":"admin@demo.com","fullName":"Full Name","email":"admin@demo.com","token":"4c9cedf8cbd9adff7705e3891318eaf5","group":"admin"}
```
Otherwise reposne will be 
``` json
{"status":401}
```

Upon receiving 200 (valid) status front-end will send a GET request to **/api/verify** with the token in the header. So in this case header file will contain ```{authorization: '4c9cedf8cbd9adff7705e3891318eaf5'}```. This request can be simulated with the following curl command.
``` bash
curl -H "authorization: 4c9cedf8cbd9adff7705e3891318eaf5" http://localhost:5000/api/verify
```
If the token is valid the reposne wiil contain the id of the user. It will look like
``` json
{"status":200, "id":0}
```
If the token is not valid, response will be 
``` json
{"status":401}
```

For adding new student enter
```bash
curl -F "token=4c9cedf8cbd9adff7705e3891318eaf5" -F "id=1" -F "image=/location/to/image" -F "roll=1" localhost:5000/newStudent
```

For adding new employee enter
```bash
curl -F "token=4c9cedf8cbd9adff7705e3891318eaf5" -F "eid=1" -F "image=/location/to/image" -F "roll=1" localhost:5000/newEmployee
```
You can -F tag to add more student criterias. Like for adding stident with a name add ```-F "name=SomeName"``` to the list of -f tags before the link. For both cases if the request is succesfull you will get **OK/200** response. If your token or id is wrong then your response will be ```{"status":401}```.