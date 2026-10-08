import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import {Server} from 'socket.io';
import {fileURLToPath} from 'url';

const __filename=fileURLToPath(import.meta.url), __dirname=path.dirname(__filename);
const ROOT=path.join(__dirname,'..'); const DATA=path.join(__dirname,'data','db.json'); const UPLOADS=path.join(__dirname,'uploads');
fs.mkdirSync(UPLOADS,{recursive:true});
const load=()=>JSON.parse(fs.readFileSync(DATA,'utf8')); const save=(d:any)=>fs.writeFileSync(DATA,JSON.stringify(d,null,2));
const app=express(); const server=http.createServer(app); const io=new Server(server,{cors:{origin:'*'}});
app.use(cors()); app.use(express.json()); app.use('/uploads',express.static(UPLOADS));
const upload=multer({storage:multer.diskStorage({destination:UPLOADS,filename:(_r,f)=>Date.now()+'-'+f.originalname.replace(/[^a-zA-Z0-9._-]/g,'_')}),limits:{fileSize:8*1024*1024}});
const SECRET=process.env.JWT_SECRET||'railguard-demo-secret';
function auth(req:any,res:any,next:any){try{const h=req.headers.authorization||''; if(!h.startsWith('Bearer ')) throw 0; req.user=jwt.verify(h.slice(7),SECRET); next();}catch{res.status(401).json({message:'Authentication required'});}}
function role(...roles:string[]){return (req:any,res:any,next:any)=>roles.includes(req.user?.role)?next():res.status(403).json({message:'Access denied'});}
app.get('/api/health',(_q,res)=>res.json({ok:true,time:new Date().toISOString()}));
app.post('/api/auth/login',(req,res)=>{const {email,password}=req.body; const db=load(); const u=db.users.find((x:any)=>x.email===email&&x.password===password); if(!u)return res.status(401).json({message:'Invalid email or password'}); const user={id:u.id,name:u.name,email:u.email,role:u.role}; res.json({token:jwt.sign(user,SECRET,{expiresIn:'12h'}),user});});
app.get('/api/me',auth,(req:any,res)=>res.json({user:req.user}));
app.get('/api/issues',auth,(req:any,res)=>{const db=load(); let list=db.issues; if(req.user.role==='worker') list=list.filter((x:any)=>x.status!=='Completed'); res.json(list.sort((a:any,b:any)=>({Critical:0,High:1,Medium:2,Low:3}[a.priority]??4)-({Critical:0,High:1,Medium:2,Low:3}[b.priority]??4)));});
app.get('/api/admin/overview',auth,role('admin'),(_req,res)=>{const db=load(); const active=db.issues.filter((x:any)=>x.status!=='Completed'); res.json({stats:{active:active.length,critical:active.filter((x:any)=>x.priority==='Critical').length,inProgress:active.filter((x:any)=>x.status==='In Progress').length,completed:db.issues.filter((x:any)=>x.status==='Completed').length},issues:active});});
app.patch('/api/issues/:id/status',auth,role('worker','admin'),(req:any,res)=>{const db=load(); const item=db.issues.find((x:any)=>x.id===req.params.id); if(!item)return res.status(404).json({message:'Issue not found'}); item.status=req.body.status; item.updatedAt=new Date().toISOString(); if(req.user.role==='worker') item.assignedTo=req.user.id; save(db); io.emit('issue:update',item); res.json(item);});
app.patch('/api/issues/:id/assign',auth,role('admin'),(req,res)=>{const db=load(); const item=db.issues.find((x:any)=>x.id===req.params.id); if(!item)return res.status(404).json({message:'Issue not found'}); item.assignedTo=req.body.workerId; item.status='In Progress'; item.updatedAt=new Date().toISOString(); save(db); io.emit('issue:update',item); res.json(item);});
app.post('/api/public/issues',upload.single('image'),(req,res)=>{try{const db=load(); const id='PUB-'+String(Date.now()).slice(-6); const issue={id,source:'public',title:req.body.title||'Public track issue',description:req.body.description||'',location:req.body.location||'Location not supplied',lat:req.body.lat!==''&&req.body.lat!=null?Number(req.body.lat):null,lng:req.body.lng!==''&&req.body.lng!=null?Number(req.body.lng):null,priority:'Medium',status:'Active',image:req.file?'/uploads/'+req.file.filename:(req.body.image||''),reportedBy:req.body.name||'Public Reporter',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}; db.issues.push(issue); save(db); io.emit('issue:new',issue); res.status(201).json(issue);}catch(e){console.error('Public issue save failed:',e);res.status(500).json({message:'Unable to save the public report'});}});
app.use((err:any,_req:any,res:any,next:any)=>{if(err){console.error(err);return res.status(400).json({message:err.message||'Upload failed'});}next();});
app.post('/api/robot/command',auth,role('admin'),(req,res)=>{const command=req.body.command; const allowed=['START','STOP','RETURN_TO_DOCK','AUTO_ON','AUTO_OFF']; if(!allowed.includes(command))return res.status(400).json({message:'Invalid command'}); io.emit('robot:command',{command,at:new Date().toISOString()}); res.json({ok:true,command});});
let robot={mode:'AUTO',state:'PATROLLING',battery:87,speed:1.2,lat:9.9195,lng:78.1193,segment:'MAD-428/7',vibration:1.42,water:12,temperature:31.6,obstacle:4.8,lastSeen:new Date().toISOString()};
app.get('/api/robot/status',auth,role('admin'),(_req,res)=>res.json(robot));
setInterval(()=>{robot={...robot,battery:Math.max(15,robot.battery-(robot.state==='PATROLLING'?0.02:0)),vibration:Number((1.1+Math.random()*1.3).toFixed(2)),water:Number((8+Math.random()*15).toFixed(1)),temperature:Number((30+Math.random()*3).toFixed(1)),obstacle:Number((3.8+Math.random()*2).toFixed(1)),lastSeen:new Date().toISOString()}; io.emit('telemetry:update',robot);},1800);
io.on('connection',socket=>{socket.emit('telemetry:update',robot); socket.on('disconnect',()=>{});});
const PORT=Number(process.env.PORT)||4000; server.listen(PORT,()=>console.log(`RailGuard backend running on http://localhost:${PORT}`));
