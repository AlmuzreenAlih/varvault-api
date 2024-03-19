import * as MODEL from '../models.js';
import * as HASH from '../../hash.js';
import * as SCHEMA from '../../schema.js';

export async function register(req, res) {
    let username    =   req.body.username;
    let password    =   req.body.password;

    // Check if the username already exists
    if ((await MODEL.selectUserByUsername(username)).length > 0) {
      return res.status(409).json({ error: "Username already registered" });
    }

    //Validate the user inputs
    try {
      await SCHEMA.validateUserData(username, password);
    } catch(validationError) { //console.log(validationError);
        console.log(validationError["status"]);
      return res.status(validationError["status"]).json({ error: validationError });
    }
    
    //Hash the password
    try {
      const hashedPassword = await HASH.hashPassword(password);
      try {
        await MODEL.insertUser(username, hashedPassword);
        res.json({message: "Registration Successful for " + username + "."});
      } catch (SQLError) { console.log(SQLError);
        return res.status(400).json({ error: "SQL Error registering user" });
      }
    } catch (HashingError) { console.log(HashingError);
      return res.status(400).json({ error: "Error at password hashing" });
    }
}

export async function genToken(req, res) {
  const username        =   req.body.username;
  const password_input  =   req.body.password;

  // Check if username is in the database
  const stored_user = await MODEL.selectUserByUsername(username);
  if ((stored_user.length < 1)) {
    return res.status(409).json({ error: "Wrong username/password" });
  }

  // Check if Password is matched with the stored
  const stored_user_id = stored_user[0]['id'];
  const stored_user_pw = stored_user[0]['pw'];
  try {
    const passwordMatch = await HASH.comparePassword(password_input, stored_user_pw);
    if (passwordMatch) {
      try {
        const returnedtoken = await MODEL.insertGeneratedToken(stored_user_id);
        return res.json({message: "Token generated for " + username, token: returnedtoken, expires_in: "30 days"});
      } catch (SQLError) { console.log(SQLError);
        return res.status(409).json({ error: "SQL error inserting token" });
      }
    } else {
      return res.status(409).json({ error: "Wrong username/password." });
    }
  } catch (ComparingError) { console.log(ComparingError);
    return res.status(409).json({ error: "Password comparing error" });
  }
}