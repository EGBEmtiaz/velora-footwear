import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const secret = process.env.JWT_SECRET;

export function loginAdmin(email, password) {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) return null;
  if (email !== process.env.ADMIN_EMAIL) return null;
  const ok = bcrypt.compareSync(password, process.env.ADMIN_PASSWORD.startsWith("$2") ? process.env.ADMIN_PASSWORD : bcrypt.hashSync(process.env.ADMIN_PASSWORD, 12));
  if (!ok) return null;
  return jwt.sign({ role:"admin", email }, secret, { expiresIn:"12h" });
}

export function requireAdmin(req,res,next) {
  try {
    const token = req.cookies?.velora_admin;
    if (!token) return res.status(401).json({error:"Unauthorized"});
    const payload = jwt.verify(token, secret);
    if (payload.role !== "admin") throw new Error("bad role");
    req.admin = payload;
    next();
  } catch {
    res.status(401).json({error:"Unauthorized"});
  }
}
