import * as MODEL from '../models.js';
import * as HASH from '../../hash.js'; //git ignored
import * as SCHEMA from '../../schema.js';
import * as TIMEUTILS from '../../utils/timeUtils.js'

export async function register(req, res) {
  let username    =   req.body.username;
  let password    =   req.body.password;

  //Validate the user inputs
  try {
    await SCHEMA.validateUserData(username, password);
  } catch(validationError) { //console.log(validationError);
      console.log(validationError["status"]);
    return res.status(validationError["status"]).json({ error: validationError });
  }

  // Check if the username already exists
  if ((await MODEL.selectUserByUsername(username)).length > 0) {
    return res.status(409).json({ error: "Username already registered" });
  }
  
  //Hash the password
  let hashedPassword;
  try {
    hashedPassword = await HASH.hashPassword(password);
  } catch (HashingError) { //console.log(HashingError);
    return res.status(400).json({ error: "Error at password hashing" });
  }

  //Insert the user
  try {
    await MODEL.insertUser(username, hashedPassword);
    res.json({message: "Registration Successful for " + username + "."});
  } catch (SQLError) { console.log(SQLError);
    return res.status(400).json({ error: "SQL Error registering user" });
  }
}

export async function genToken(req, res) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const encodedCredentials = authHeader.split(' ')[1];
  const decodedCredentials = Buffer.from(encodedCredentials, 'base64').toString('utf-8');
  const [username, password_input] = decodedCredentials.split(':');

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
    if (!passwordMatch) {
      return res.status(409).json({ error: "Wrong username/password." });
    }
  } catch (ComparingError) { console.log(ComparingError);
    return res.status(409).json({ error: "Password comparing error" });
  }

  //Insert Generated Token
  try {
    const returnedtoken = await MODEL.insertGeneratedToken(stored_user_id);
    return res.json({message: "Token generated for " + username, token: returnedtoken, expires_in: "30 days"});
  } catch (SQLError) { console.log(SQLError);
    return res.status(409).json({ error: "SQL error inserting token" });
  }
}

export async function changeUsername(req, res) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const encodedCredentials = authHeader.split(' ')[1];
  const decodedCredentials = Buffer.from(encodedCredentials, 'base64').toString('utf-8');
  const [username, password_input] = decodedCredentials.split(':');
  const new_username                = req.body['new_username'];

  // Validate the input
  if (SCHEMA.DetectUndefined(new_username)) {
    let nullVars = [];
    if (SCHEMA.DetectUndefined(new_username)) {nullVars.push("new_username");}

    return res.status(409).json({ error: "These fields must be specified: [" + nullVars.join(',') + "]"});
  }

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
    if (!passwordMatch) {
      return res.status(409).json({ error: "Wrong username/password." });
    }
  } catch (ComparingError) { console.log(ComparingError);
    return res.status(409).json({ error: "Password comparing error" });
  }
  
  //Validate the new username
  try {
    await SCHEMA.validateUserData(new_username, password_input);
  } catch(validationError) {
    return res.status(validationError["status"]).json({ error: validationError });
  }

  // Check if the usernames are the same
  if (new_username === username) {
    return res.status(409).json({ error: "New username cannot be the same as the previous username." });
  }

  // Check if the new username is already used
  const stored_user2 = await MODEL.selectUserByUsername(new_username);
  if ((stored_user2.length > 0)) {
    return res.status(409).json({ error: "The new username is already used." });
  }

  // Update the Username
  try {
    await MODEL.updateUserUsername(stored_user_id,new_username);
    return res.json({message: "Successful username update"});

  } catch (SQLError) { console.log(SQLError);
    return res.status(409).json({ error: "SQL error changing username" });
  }
}

export async function changePassword(req, res) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const encodedCredentials = authHeader.split(' ')[1];
  const decodedCredentials = Buffer.from(encodedCredentials, 'base64').toString('utf-8');
  const [username, password_input] = decodedCredentials.split(':');
  const new_password                = req.body['new_password'];

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
    if (!passwordMatch) {
      return res.status(409).json({ error: "Wrong username/password." });
    }
  } catch (ComparingError) { console.log(ComparingError);
    return res.status(409).json({ error: "Password comparing error" });
  }
  
  //Validate the input
  if (SCHEMA.DetectUndefined(new_password)) {
    let nullVars = [];
    if (SCHEMA.DetectUndefined(new_password)) {nullVars.push("new_password");}

    return res.status(409).json({ error: "These fields must be specified: [" + nullVars.join(',') + "]"});
  }

  //Validate the new password
  try {
    await SCHEMA.validateUserData(username, new_password);
  } catch(validationError) {
    return res.status(validationError["status"]).json({ error: validationError });
  }

  // Hash the password
  let hashedPassword;
  try {
    hashedPassword = await HASH.hashPassword(new_password);
  } catch (HashingError) { //console.log(HashingError);
    return res.status(400).json({ error: "Error at password hashing" });
  }

  // Check if Password is matched with the stored
  try {
    const passwordMatch = await HASH.comparePassword(new_password, stored_user_pw);
    if (passwordMatch) {
      return res.status(409).json({ error: "New password cannot be the same as the previous password." });
    }
  } catch (ComparingError) { console.log(ComparingError);
    return res.status(409).json({ error: "Password comparing error" });
  }

  // Update the password
  try {
    await MODEL.updateUserPassword(stored_user_id,hashedPassword);
    return res.json({message: "Successful password update"});

  } catch (SQLError) { console.log(SQLError);
    return res.status(409).json({ error: "SQL error changing password" });
  }
}

export async function renewToken(req, res) {
  // Get the user's input
  // Extract the Bearer token from the Authorization header
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1]; // Extract the token part

  // Check if token is in the database
  const stored_token = await MODEL.selectToken(token);
  if ((stored_token.length < 1)) {
    return res.status(409).json({ error: "Token not found" });
  }

  const stored_token_user_id = stored_token[0]['user_id'];

  // Renew the token of the user
  try {
    await MODEL.renewUserToken(token);
    return res.json({ message: "Token expiration is renewed." });
  } catch (e) {
    return res.json({ error: e });
  }
}

export async function getAllTokens(req, res) {
  // Get the user's input
  // Extract the Bearer token from the Authorization header
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1]; // Extract the token part

  // Check if token is in the database
  const stored_token = await MODEL.selectToken(token);
  if ((stored_token.length < 1)) {
    return res.status(409).json({ error: "Token not found" });
  }
  const elapsedTime = TIMEUTILS.calculateTimeElapsed(stored_token[0].updated_at);
  if (elapsedTime.days >= 30) {
    return res.status(401).json({ error: "Token expired ", elapsedTime});
  }

  const stored_token_user_id = stored_token[0]['user_id'];

  // Get All tokens of the user
  try {
    const allTokens = await MODEL.getAllUserTokens(stored_token_user_id);
    return res.json({ tokens: allTokens });
  } catch {
    return res.json({ error: "SQL Error getting all user tokens" });
  }
}