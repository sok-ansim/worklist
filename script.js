import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, addDoc, doc, updateDoc, deleteDoc,
  query, where, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 🔽 여기만 네 값으로 바꾸기
const firebaseConfig = {
  apiKey: "AIzaSyD21eQ4LDWVzT5mdn9DBXgJj2cWrFBj6uc",
  authDomain: "sokansimworklist.firebaseapp.com",
  projectId: "sokansimworklist",
  storageBucket: "sokansimworklist.firebasestorage.app",
  messagingSenderId: "528257328628",
  appId: "1:528257328628:web:27fa057d01964ff08685a1",
  measurementId: "G-SNSZSGHZV4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const COL = "worklist";

function pad2(n){ return String(n).padStart(2,"0"); }
function todayStr(){
  const d=new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
}
function fmtTime(ts){
  if(!ts) return "-";
  const d=ts.toDate();
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

const $=id=>document.getElementById(id);
let all=[];

function render(){
  const q=($("q").value||"").toLowerCase();
  const list=$("list");
  list.innerHTML="";
  const f=all.filter(it=>(`${it.name} ${it.chart} ${it.exam}`).toLowerCase().includes(q))
             .sort((a,b)=>a.examDate<b.examDate?1:-1);

  let g={};
  f.forEach(it=>{(g[it.examDate]=g[it.examDate]||[]).push(it);});
  Object.keys(g).sort((a,b)=>a<b?1:-1).forEach(d=>{
    list.innerHTML+=`<tr class="groupRow"><td colspan="10">📅 ${d}</td></tr>`;
    g[d].forEach(it=>{
      list.innerHTML+=`
      <tr>
        <td>${it.examDate}</td>
        <td>${it.name}</td>
        <td>${it.chart}</td>
        <td>${it.exam}</td>
        <td>${it.status}</td>
        <td>${fmtTime(it.visitAt)}</td>
        <td>${fmtTime(it.startAt)}<br><button onclick="startExam('${it.id}')">Start</button></td>
        <td>${fmtTime(it.finishAt)}<br><button onclick="finishExam('${it.id}')">Finish</button></td>
        <td><button onclick="markVisit('${it.id}')">내원</button></td>
        <td><button onclick="removeItem('${it.id}')">삭제</button></td>
      </tr>`;
    });
  });
}

async function addItem(){
  await addDoc(collection(db,COL),{
    name:$("name").value,
    chart:$("chart").value,
    exam:$("exam").value,
    examDate:$("examDate").value,
    status:"대기",
    visitAt:null,startAt:null,finishAt:null,
    createdAt:serverTimestamp()
  });
  $("name").value="";$("chart").value="";
}

async function markVisit(id){
  await updateDoc(doc(db,COL,id),{status:"내원",visitAt:serverTimestamp()});
}
async function startExam(id){
  await updateDoc(doc(db,COL,id),{status:"진행중",startAt:serverTimestamp()});
}
async function finishExam(id){
  await updateDoc(doc(db,COL,id),{status:"완료",finishAt:serverTimestamp()});
}
async function removeItem(id){
  await deleteDoc(doc(db,COL,id));
}

window.addItem=addItem;
window.markVisit=markVisit;
window.startExam=startExam;
window.finishExam=finishExam;
window.removeItem=removeItem;

$("examDate").value=todayStr();
$("btnAdd").onclick=addItem;
$("btnSearch").onclick=render;
$("btnReset").onclick=()=>{$("q").value="";render();};

onAuthStateChanged(auth,()=>{
  const qy=query(collection(db,COL));
  onSnapshot(qy,s=>{
    all=s.docs.map(d=>({id:d.id,...d.data()}));
    render();
  });
});
signInAnonymously(auth);
