import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, addDoc, doc, updateDoc, deleteDoc,
  query, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* Firebase 설정 */
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

const $ = (id) => document.getElementById(id);

function pad2(n){ return String(n).padStart(2,"0"); }
function todayStr(){
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
}
function fmtTime(ts){
  if(!ts) return "-";
  const d = ts.toDate();
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

let all = [];

/* 화면 그리기 */
function render(){
  const q = (($("q")?.value || "").trim()).toLowerCase();
  const list = $("list");
  list.innerHTML = "";

  const filtered = all
    .filter(it => {
      if(!q) return true;
      const hay = `${it.name} ${it.chart} ${it.exam}`.toLowerCase();
      return hay.includes(q);
    })
    .sort((a,b) => {
      if(a.examDate !== b.examDate) return a.examDate < b.examDate ? 1 : -1;
      return (b.createdAtMs || 0) - (a.createdAtMs || 0);
    });

  const groups = new Map();
  for(const it of filtered){
    if(!groups.has(it.examDate)) groups.set(it.examDate, []);
    groups.get(it.examDate).push(it);
  }

  const dates = Array.from(groups.keys()).sort((a,b)=> a < b ? 1 : -1);

  for(const d of dates){
    const trG = document.createElement("tr");
    trG.className = "groupRow";
    trG.innerHTML = `<td colspan="10">${d}</td>`;
    list.appendChild(trG);

    for(const it of groups.get(d)){
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${it.examDate}</td>
        <td>${it.name}</td>
        <td>${it.chart}</td>
        <td>${it.exam}</td>
        <td>${it.status}</td>
        <td>${fmtTime(it.visitAt)}</td>
        <td>${fmtTime(it.startAt)} <button data-act="start" data-id="${it.id}">Start</button></td>
        <td>${fmtTime(it.finishAt)} <button data-act="finish" data-id="${it.id}">Finish</button></td>
        <td><button data-act="visit" data-id="${it.id}">내원</button></td>
        <td><button data-act="del" data-id="${it.id}">삭제</button></td>
      `;
      list.appendChild(tr);
    }
  }
}

/* 등록 */
async function addItem(){
  const name = $("name").value.trim();
  const chart = $("chart").value.trim();
  const exam = $("exam").value;
  const examDate = $("examDate").value;

  if(!name || !chart){
    alert("이름과 차트번호를 입력하세요.");
    return;
  }

  await addDoc(collection(db, COL), {
    name,
    chart,
    exam,
    examDate,
    status: "대기",
    visitAt: null,
    startAt: null,
    finishAt: null,
    createdAt: serverTimestamp(),
    createdAtMs: Date.now()
  });

  $("name").value = "";
  $("chart").value = "";
}

/* 상태 변경 */
async function markVisit(id){
  await updateDoc(doc(db, COL, id), {
    status: "내원",
    visitAt: serverTimestamp()
  });
}
async function startExam(id){
  await updateDoc(doc(db, COL, id), {
    status: "진행중",
    startAt: serverTimestamp()
  });
}
async function finishExam(id){
  await updateDoc(doc(db, COL, id), {
    status: "완료",
    finishAt: serverTimestamp()
  });
}
async function removeItem(id){
  if(!confirm("삭제할까요?")) return;
  await deleteDoc(doc(db, COL, id));
}

/* 이벤트 연결 */
function wireEvents(){
  $("btnAdd").addEventListener("click", addItem);
  $("btnSearch").addEventListener("click", render);
  $("btnReset").addEventListener("click", () => {
    $("q").value = "";
    render();
  });

  $("list").addEventListener("click", async (e)=>{
    const btn = e.target.closest("button");
    if(!btn) return;
    const act = btn.dataset.act;
    const id = btn.dataset.id;
    if(!id) return;

    if(act==="visit") await markVisit(id);
    if(act==="start") await startExam(id);
    if(act==="finish") await finishExam(id);
    if(act==="del") await removeItem(id);
  });
}

/* 시작 */
$("examDate").value = todayStr();
wireEvents();

onAuthStateChanged(auth, (user)=>{
  if(!user) return;

  const qy = query(collection(db, COL));
  onSnapshot(qy, (snap)=>{
    all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    render();
  });
});

signInAnonymously(auth);
