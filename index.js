//modules required

const express = require("express");
const app = express();
var file = require('./data.json');
var bodyParser = require("body-parser");
var passwordValidator = require("password-validator");
// create application/json parser

var schema = new passwordValidator();

schema
.is().min(8)                                    // Minimum length 8
.is().max(100)                                  // Maximum length 100
.has().uppercase()                              // Must have uppercase letters
.has().lowercase()                              // Must have lowercase letters
.has().digits(1)                                // Must have at least 2 digits
.has().symbols(1)	                           // Should not have spaces
// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })
var fs = require("fs");
var jsonData = file

console.log(jsonData)
app.post("/createUser",urlencodedParser ,(req, res) => {
    let reqBody = req.body;
    //check if the request body contains email and password
    if (reqBody.email && reqBody.password) {
        //validate unique email
               const [emailExsists, userData] = findEmail(reqBody.email);

            console.log('uniq email')
              if (emailExsists) {
                  res.send("email already exsists");
              }
            
            //email is unique
            if (!emailExsists) {
                //validate password
                if (schema.validate(reqBody.password)) {
                    if (validateEmail(reqBody.email)) {
                        //append to the json file
                        let id = Math.floor(Math.random() * 1000000000);
                        jsonData[id] = {
                            email: reqBody.email,
                            password: reqBody.password,
                            updatedAt: Date.now(),
                            lastPasswords: new Array(reqBody.password) ,
                        };
                        fs.writeFile(
                            "./data.json",
                            JSON.stringify(jsonData),
                            "utf8",
                            function (err) {
                                if (err) {
                                    return console.log(err);
                                }

                                console.log("The file was saved!");
                            }
                        );
                        res.send({
                            message: "User created successfuly",
                            data: { userId: id, email: reqBody.email },
                        });
                    } else {
                        res.send("Invalid email");
                    }
                } else {
                    res.send(
                        "password must be at least 8 characters with at least 1 Upper Case, 1 lower case, 1 special character and 1 numeric"
                    );
                }
            }
          
        }
    else {
        res.send('Email & Password cannot be empty')
                          

    }
    
  
  

    

   

    // res.send(JSON.stringify(file));
});
app.post("/login", urlencodedParser, (req, res) => {
    let reqBody = req.body;
    //make sure email and password are sent
    if (reqBody.email && reqBody.password) {
        //check if the user email exsist in the file
        const [emailExsists, userData] = findEmail(reqBody.email);
        


        //user doesn't exsist
        if (!emailExsists) {
            res.send("User doesn't exsist on our systems");
        }
        //user exsists

        if (emailExsists) {
            //password expired
            if (checkPasswordValidDate(userData.updatedAt) >= 90) {
                res.send("Password expired, please change password");
            }
            //password valid
            else {
                //check if password is correct
                if (reqBody.password === userData.password) {
                    res.send({"message":"success","data":{"email":userData.email}})
                }
                else {
                    res.send("Incorrect password")
                }

            }
        }
    }


    else {
        res.send('email and password are required')
    }

  

    // res.send(JSON.stringify(file));
});
app.post("/changePassword", urlencodedParser, (req, res) => {
    var emailExsists = false;
    let reqBody = req.body;
    let userData = "";
    let isPasswordUnique = true;
    //make sure email and password are sent
    if (reqBody.email && reqBody.password) {
        const [emailExsists, userData, userId] = findEmail(reqBody.email);
        if (emailExsists) {
            let passwords = userData.lastPasswords;
            //password passed validations
            if (schema.validate(reqBody.password)) {

                //check if password uniqueq
                passwords.map((item) => {
                    if (item === reqBody.password) {
                        isPasswordUnique = false;

                    }
                });
                
                if (!isPasswordUnique) {
                   res.send('You need to use new password')
                }
                if (isPasswordUnique) {
                    if (passwords.length == 3) {
                        passwords.pop();
                        passwords.unshift(reqBody.password);
                         jsonData[userId].lastPasswords = passwords;
                        jsonData[userId].password = reqBody.password;
                        jsonData[userId].updatedAt = Date.now();
                          fs.writeFile(
                              "./data.json",
                              JSON.stringify(jsonData),
                              "utf8",
                              function (err) {
                                  if (err) {
                                      return console.log(err);
                                  }

                                  console.log("The file was saved!");
                              }
                        );
                                                res.send("Password Changed +3");

                    }
                    else {
                        passwords.unshift(reqBody.password);
                        jsonData[userId].lastPasswords = passwords;
                        jsonData[userId].password=reqBody.password;
                           fs.writeFile(
                               "./data.json",
                               JSON.stringify(jsonData),
                               "utf8",
                               function (err) {
                                   if (err) {
                                       return console.log(err);
                                   }

                                   console.log("The file was saved!");
                               }
                           );
                        res.send("Password Changed");
                    }
                 

                }
                



            } else {
                res.send(
                    "password must be at least 8 characters with at least 1 Upper Case, 1 lower case, 1 special character and 1 numeric"
                );
            }

            res.send(passwords);
        }
        else {
            res.send("Email doesn't exsist")
        }
    } else {
        res.send("email and password are required");
    }

    // res.send(JSON.stringify(file));
});


function checkPasswordValidDate(date) {
   const date1 = new Date(date);
    const date2 = new Date();
    console.log(date2)
   const diffTime = Math.abs(date2 - date1);
   const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
   console.log(diffTime + " milliseconds");
    console.log(diffDays + " days");
    return diffDays
}
function findEmail(email) {
    let emailExsists = false;
    let userData = ''
    let userId;
     for (var key in jsonData) {
         if (jsonData[key].email == email) {
             emailExsists = true;
             userData = jsonData[key];
             userId = key;
             break;
         }
    }
    return [emailExsists, userData, userId];
}

function validateEmail(email) {
    const re =
        /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}
// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}...`);
});



