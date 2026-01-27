// 새로고침해도 목록 유지되게(설치 필요 없음)
let patients = JSON.parse(localStorage.getItem("patients") || "[]");

function save() {
  localStorage.setItem("patients", JSON.stringify(patients));
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatNow() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

function addPatient() {
  const name = document.getElementById("name").value.trim();
  const chart = document.getElementById("chart").value.trim();
  const exam = document.getElementById("exam").value;

  if (!name || !chart) {
    alert("이름과 차트번호를 입력해 주세요.");
    return;
  }

  const patient = {
    name,
    chart,
    exam,
    status: "대기",
    startedAt: "",
    finishedAt: ""
  };

  patients.push(patient);
  save();
  render();

  // 입력칸 비우기
  document.getElementById("name").value = "";
  document.getElementById("chart").value = "";
}

function startExam(index) {
  const p = patients[index];

  if (p.status !== "대기") {
    alert("대기 상태에서만 Start가 가능합니다.");
    return;
  }

  p.status = "진행중";
  p.startedAt = formatNow();
  save();
  render();
}

function finishExam(index) {
  const p = patients[index];

  if (p.status !== "진행중") {
    alert("진행중 상태에서만 Finish가 가능합니다.");
    return;
  }

  p.status = "완료";
  p.finishedAt = formatNow();
  save();
  render();
}

// (선택) 잘못 등록한 경우 지우기용
function removeRow(index) {
  if (!confirm("해당 항목을 삭제할까요?")) return;
  patients.splice(index, 1);
  save();
  render();
}

function render() {
  const list = document.getElementById("list");
  list.innerHTML = "";

  patients.forEach((p, i) => {
    const startDisabled = p.status !== "대기" ? "disabled" : "";
    const finishDisabled = p.status !== "진행중" ? "disabled" : "";

    list.innerHTML += `
      <tr>
        <td>${p.name}</td>
        <td>${p.chart}</td>
        <td>${p.exam}</td>
        <td>${p.status}</td>
        <td>${p.startedAt || "-"}</td>
        <td>${p.finishedAt || "-"}</td>
        <td><button ${startDisabled} onclick="startExam(${i})">Start</button></td>
        <td><button ${finishDisabled} onclick="finishExam(${i})">Finish</button></td>
      </tr>
    `;
  });
}

// 첫 화면 그리기
render();
