const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { mailTransporter } = require("../Utils/Mailer.js");
const saltRounds = 12;
const {
  sendMessage,
  getAllNews,
  createMemo,
  User,
  readMessage,
  sentMessages,
  createUser,
  addUser,
  compareCodes,
  createAuthority,
  forgetPassword,
  getAccounts,
  acceptRequest,
  memoDialogue,
  shareNextAuthority,
  forwardMemo,
  announceMemo,
  deleteMemo,
} = require("../Controllers/Logic.js");

const signIn = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User(username);
    if (user) {
      const matchPass = await bcrypt.compare(password, user.password);
      if (matchPass) {
        const jwt_ = jwt.sign(
          {
            payload: user.username,
          },
          process.env.SECRET_KEY,
          {
            expiresIn: "2 days",
          }
        );
        res.cookie("userToken", jwt_, {
          maxAge: 9000000,
          path: "/api/",
          httpOnly: false,
        });
        res.setHeader("Content-Type", "Text/html");
        res.redirect(302, "/api/user");
      } else {
        res.send({ response: "invalid password", signinStatus: false });
        return;
      }
    } else {
      res.send({ response: "User not found", signinStatus: false });
      return;
    }
  } catch (error) {
    res.send({ response: "inernal error, failed to sign in" });
  }
};

const userApi = async (req, res) => {
  const name = req.user.payload;
  try {
    const user = await User(name);
    if (user) {
      res.json(user);
    }
  } catch (error) {
    res.send(error);
  }
};

const myMessage = async (req, res) => {
  const messages = await sentMessages(req.user.name);
  res.send(messages);
};

const createMessage = async (req, res) => {
  const { username, message } = req.body;
  const data = await sendMessage(username, message, req.user.payload);
  res.send({ message: data });
};

// create new Memo
const createNewMemo = async (req, res) => {
  const { heading, from, to, ref, body, key } = req.body;
  try {
    const data = await createMemo(heading, from, to, ref, body, key);
    res.send(data);
  } catch (error) {
    res.send(error);
  }
};
const fwdMemo = async (req, res) => {
  const { recipient, memoId } = req.body;

  try {
    const status = await forwardMemo(recipient, req.user.payload, memoId);
 

    res.send({ response: "memo successfully forwarded", status });
  } catch (error) {
    res.send({ response: "internal error, Unable to forward memo", error });
  }
};

//  memo dialogue
const createDialogue = async (req, res) => {
  const { response, id, sender } = req.body;
  try {
    const status = await memoDialogue(id, req.user.payload, sender, response);
    res.send(status);
  } catch (error) {
    res.send(error);
  }
};

//  share to the next authority
const shareNext = async (req, res) => {
  const { recipient, memoId, memoCreator } = req.body;

  try {
    const data = await shareNextAuthority(
      recipient,
      req.user.payload,
      memoId,
      memoCreator
    );
    res.send({ response: "memo successfully forwarded!", data });
  } catch (error) {
    res.send({ response: "memo could not be shared, internal error" });
  }
};

//  accept new user request

const acceptReq = async (req, res) => {
  const { id, username } = req.body;
  let user = req.user.payload;
  const status = await acceptRequest(id, username, user);
  res.send(status);
};

//  create account
const signup = async (req, res) => {
  const { name, email, username, password, role } = req.body;
  try {
    const existUser = await User(username);
    if (existUser) {
      res.send({ response: "username is taken" });
    } else {
      let result = await createUser(name, username, password, email, role);
      res.send({
        response: result,
      });
    }
  } catch (error) {
    res.send(error);
  }
};

//  read recieved message
const readNewMessage = async (req, res) => {
  const { messageId } = req.body;
  const status = await readMessage(messageId, req.user.payload);
  res.send(status);
};

//  send user request
const addNewUser = async (req, res) => {
  const { connectName, role } = req.body;
  const name = req.user.payload;
  try {
    const addStatus = await addUser(name, connectName, role);
    res.send({ response: addStatus });
  } catch (error) {
    res.send(error);
  }
};
//  get all admins
const getAdmins = async (req, res) => {
  const accounts = await getAccounts();
  res.send(accounts);
};

//  share to the  general announcement page
const announce = async (req, res) => {
  const { memoKey } = req.body;
  try {
    const data = await announceMemo(req.user.payload, memoKey);
    res.send({
      response: "memo successfully posted",
      data,
    });
    console.log(data);
  } catch (error) {
    res.send({
      response: "internal error, unable be share to the anouncement page",
      error,
    });
  }
};

//  get all news shared
const getAllUpdates = async (req, res) => {
  try {
    const allData = await getAllNews();
    res.send(allData);
  } catch (error) {
    res.send(error);
  }
};

//  password recovery
const passwordRecovery = async (req, res) => {
  const code = req.verify;
  const { userCode, newPassword } = req.body;
  const { verificatonCode, email } = code.payload;
  const encryptedPassword = await bcrypt.hash(newPassword, saltRounds);
  try {
    const changeStatus = await compareCodes(
      userCode,
      verificatonCode,
      email,
      encryptedPassword
    );
    res.send({ response: changeStatus });
  } catch (error) {
    res.send(error);
  }
};

// initiate forgot password
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await forgetPassword(email);
  if (user) {
    try {
      const verificatonCode = `${Math.floor(Math.random() * 728975)}`;

      const info = await mailTransporter.sendMail({
        from: "Oysciety",
        to: email,
        subject: "Verification Code",
        html: `<p> Dear ${email} your password recovery code is ${verificatonCode} </p>`,
      });
      const codetoken = jwt.sign(
        { payload: { verificatonCode, email } },
        process.env.SECRET_KEY,
        { expiresIn: "1hr" }
      );

      res.cookie("code", codetoken, {
        maxAge: 9000000,
        path: "/api/recovery",
      });

      res.send({
        response: `Verification code sent to ${email} `,
        id: info.messageId,
      });
    } catch (error) {
      res.send({ response: "internal error", error });
    }
  } else {
    res.send({ response: `${email} not found` });
  }
};

// delete memo
const deleteMyMemo = async (req, res) => {
  const { memoId } = req.body;
  try {
    const deleteStatus = await deleteMemo(req.user.payload, memoId);
    res.send({ response: "memo deleted successfully", deleteStatus });
  } catch (error) {
    res.send({ response: "Error occured", error });
  }
};

//  log out
const signout = (req, res) => {
  res.clearCookie("userToken");
  res.cookie("userToken", "", { maxAge: 0, path: "/api" });
  res.send({ response: "account signed out successfully" });
};

module.exports = {
  announce,
  signIn,
  userApi,
  myMessage,
  createMessage,
  createNewMemo,
  fwdMemo,
  createDialogue,
  shareNext,
  acceptReq,
  signup,
  readNewMessage,
  addNewUser,
  getAdmins,
  getAllUpdates,
  passwordRecovery,
  forgotPassword,
  deleteMyMemo,
  signout,
};
