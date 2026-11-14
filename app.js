const API_BASE = "https://arsipripki-api.wkwkseseorang.workers.dev";

const $ = id => document.getElementById(id);

let questions = [];
let selected = [];
let quiz = null;
let answers = [];
let current = 0;
let finalScore = 0;

const defaults = [
["Apa makanan favoritku?",["Mie ayam","Nasi goreng","Bakso","Sate"],0],
["Kalau lagi senggang, aku biasanya...",["Tidur","Main game","Dengerin musik","Keluar rumah"],2],
["Genre film yang paling kusuka?",["Horor","Komedi","Action","Dokumenter"],0],
["Aku lebih suka suasana...",["Ramai","Tenang","Dingin dan hujan","Bebas"],1],
["Apa warna yang paling kusuka?",["Hitam","Biru","Putih","Merah"],0],
["Kalau punya waktu libur, aku pilih...",["Jalan-jalan","Di rumah","Foto-foto","Belajar hal baru"],2],
["Hal yang paling bikin aku kesal?",["Dibohongi","Diabaikan","Ditunggu","Kehabisan kuota"],1],
["Aku lebih sering...",["Banyak bicara","Jadi pendengar","Bercanda","Mengamati"],3],
["Minuman favoritku?",["Air putih","Teh","Kopi","Susu"],1],
["Kalau memilih hobi baru, aku pilih...",["Fotografi","Memasak","Olahraga","Menggambar"],0],
["Aku paling suka waktu...",["Pagi","Siang","Sore","Malam"],3],
["Kalau ada masalah, aku cenderung...",["Cerita","Diam dulu","Cari solusi","Mengalihkan pikiran"],1]
];

function show(id) {
    ["builder","share","taking","result"].forEach(x => {
        $(x).classList.toggle("hidden", x !== id);
    });
}

// ============================
// BUILDER
// ============================

function addQuestion(data = ["",["Pilihan A","Pilihan B","Pilihan C","Pilihan D"],0]) {
    questions.push({
        text: data[0],
        options: [...data[1]],
        correct: data[2] || 0,
        chosen: false
    });

    render();
}

function render() {
    const box = $("questionList");
    box.innerHTML = "";

    questions.forEach((q,i) => {
        const el = document.createElement("div");
        el.className = "qitem";

        el.innerHTML = `
            <div class="qhead">
                <span class="qnum">PERTANYAAN ${i+1}</span>
                <div class="row" style="flex:0;gap:8px">
                    <label style="margin:0;white-space:nowrap;font-size:12px">
                        <input type="checkbox" data-pick="${i}" ${q.chosen?"checked":""} style="accent-color:var(--pink)"> Pilih
                    </label>
                    <button class="danger" data-remove="${i}" type="button">Hapus</button>
                </div>
            </div>

            <label>Pertanyaan</label>
            <textarea data-q="${i}" placeholder="Tulis pertanyaan..."></textarea>

            <div class="small">Pilih radio pada jawaban yang benar.</div>
            <div class="opts"></div>

            <div class="actions">
                <button class="ghost" data-addopt="${i}" type="button">＋ Tambah opsi</button>
            </div>
        `;

        el.querySelector("textarea").value = q.text;

        const opts = el.querySelector(".opts");

        q.options.forEach((op,j) => {
            const r = document.createElement("div");
            r.className = "optrow";

            r.innerHTML = `
                <input type="radio" name="correct${i}" aria-label="Jawaban benar" ${q.correct===j?"checked":""}>
                <input type="text" maxlength="70" placeholder="Jawaban ${j+1}">
            `;

            r.querySelector('input[type="text"]').value = op;

            r.querySelector('input[type="radio"]').addEventListener("change", () => {
                q.correct = j;
            });

            r.querySelector('input[type="text"]').addEventListener("input", e => {
                q.options[j] = e.target.value;
            });

            opts.appendChild(r);
        });

        box.appendChild(el);
    });

    $("poolCount").textContent = questions.length + " pertanyaan tersedia";

    $("chosenCount").textContent =
        questions.filter(q => q.chosen).length + " / 10 dipilih";
}

$("questionList").addEventListener("input", e => {
    if (e.target.dataset.q !== undefined) {
        questions[+e.target.dataset.q].text = e.target.value;
    }
});

$("questionList").addEventListener("click", e => {

    if (e.target.dataset.remove !== undefined) {
        questions.splice(+e.target.dataset.remove,1);
        render();
    }

    if (e.target.dataset.pick !== undefined) {
        const i = +e.target.dataset.pick;

        const count = questions.filter(q => q.chosen).length;

        if (!questions[i].chosen && count >= 10) {
            e.target.checked = false;
            $("builderMsg").textContent = "Maksimal 10 pertanyaan dipilih.";
            return;
        }

        questions[i].chosen = e.target.checked;
        render();
    }

    if (e.target.dataset.addopt !== undefined) {
        const q = questions[+e.target.dataset.addopt];

        if (q.options.length < 6) {
            q.options.push("Pilihan baru");
            render();
        } else {
            $("builderMsg").textContent = "Maksimal 6 pilihan per pertanyaan.";
        }
    }
});

$("addQ").onclick = () => addQuestion();

$("sample").onclick = () => {
    questions = defaults.map(x => ({
        text: x[0],
        options: [...x[1]],
        correct: x[2],
        chosen: false
    }));

    render();

    $("builderMsg").textContent =
        "Contoh sudah dimasukkan. Ubah sesuai dirimu, lalu pilih 10.";
};

// ============================
// CREATE QUIZ - DATABASE
// ============================

$("makeQuiz").onclick = async () => {

    const name = $("owner").value.trim();
    const chosen = questions.filter(q => q.chosen);
    const button = $("makeQuiz");

    if (!name) {
        $("builderMsg").textContent = "Isi nama pembuat dulu.";
        return;
    }

    if (chosen.length !== 10) {
        $("builderMsg").textContent =
            "Pilih tepat 10 pertanyaan. Sekarang baru " + chosen.length + ".";
        return;
    }

    if (chosen.some(q =>
        !q.text.trim() ||
        q.options.length < 2 ||
        q.options.some(o => !o.trim()) ||
        !Number.isInteger(q.correct) ||
        q.correct < 0 ||
        q.correct >= q.options.length
    )) {
        $("builderMsg").textContent =
            "Lengkapi pertanyaan, pilihan, dan jawaban benar.";
        return;
    }

    quiz = {
        owner: name,
        questions: chosen.map(q => ({
            text: q.text,
            options: [...q.options],
            correct: q.correct
        }))
    };

    button.disabled = true;
    button.textContent = "Menyimpan kuis...";
    $("builderMsg").textContent = "Menghubungkan ke database...";

    try {

        const res = await fetch(API_BASE + "/api/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(quiz)
        });

        const raw = await res.text();

console.log("STATUS:", res.status);
console.log("RESPONSE:", raw);

const result = JSON.parse(raw);

        if (!res.ok || !result.success) {
            throw new Error(result.error || "Gagal menyimpan kuis.");
        }

        const link = location.origin +
            location.pathname +
            "?q=" +
            encodeURIComponent(result.id);

        $("quizLink").value = link;

        show("share");

    } catch (error) {

        $("builderMsg").textContent =
            "Gagal membuat kuis: " + error.message;

    } finally {

        button.disabled = false;
        button.textContent = "Buat kuis 10 pertanyaan →";

    }
};

// ============================
// SHARE LINK
// ============================

$("copyLink").onclick = async () => {

    try {
        await navigator.clipboard.writeText($("quizLink").value);
    } catch(e) {
        $("quizLink").select();
        document.execCommand("copy");
    }

    $("copyLink").textContent = "Tersalin ✓";

};

$("nativeShare").onclick = () => {

    if (navigator.share) {
        navigator.share({
            title: "Kuis Teman Sejati?",
            text: "Coba jawab kuis persahabatanku!",
            url: $("quizLink").value
        });
    } else {
        $("copyLink").click();
    }

};

$("backEdit").onclick = () => show("builder");

// ============================
// LOAD QUIZ FROM DATABASE
// ============================

async function loadQuiz(id) {

    show("taking");

    $("quizTitle").textContent = "Memuat kuis...";
    $("quizIntro").textContent = "Mengambil data dari database.";

    try {

        const res = await fetch(
            API_BASE + "/api/" + encodeURIComponent(id)
        );

        const result = await res.json();

        if (!res.ok || !result.success) {
            throw new Error(result.error || "Kuis tidak ditemukan.");
        }

        const data = result.data;

        if (!data.questions || data.questions.length !== 10) {
            throw new Error("Data kuis tidak valid.");
        }

        startTaking(data);

    } catch(error) {

        $("quizTitle").textContent = "Kuis tidak ditemukan";
        $("quizIntro").textContent = error.message;

        $("taking").querySelector(".progress").style.display = "none";
        $("stepLabel").textContent = "";
        $("questionText").textContent = "";
        $("answers").innerHTML = "";
        $("nextQ").style.display = "none";

    }

}

// ============================
// TAKE QUIZ
// ============================

function startTaking(data) {

    quiz = data;
    answers = Array(quiz.questions.length).fill(-1);
    current = 0;

    $("nextQ").style.display = "";
    $("taking").querySelector(".progress").style.display = "";

    $("quizTitle").textContent =
        "Seberapa kenal kamu sama " + quiz.owner + "?";

    $("quizIntro").textContent =
        "Jawab " + quiz.questions.length +
        " pertanyaan dan lihat seberapa cocok tebakanmu.";

    show("taking");

    drawQuestion();

}

function drawQuestion() {

    const q = quiz.questions[current];

    $("stepLabel").textContent =
        `PERTANYAAN ${current+1} DARI ${quiz.questions.length}`;

    $("progressBar").style.width =
        (current / quiz.questions.length * 100) + "%";

    $("questionText").textContent = q.text;

    $("answers").innerHTML = "";

    q.options.forEach((op,i) => {

        const b = document.createElement("button");

        b.className = "answer" +
            (answers[current] === i ? " selected" : "");

        b.textContent = op;

        b.onclick = () => {
            answers[current] = i;
            drawQuestion();
        };

        $("answers").appendChild(b);

    });

    $("nextQ").textContent =
        current === quiz.questions.length - 1
        ? "Lihat hasil →"
        : "Lanjut →";

    $("takeMsg").textContent =
        answers[current] === -1
        ? "Pilih satu jawaban dulu."
        : "Jawaban tersimpan.";

}

$("nextQ").onclick = () => {

    if (answers[current] === -1) {
        $("takeMsg").textContent =
            "Pilih jawaban dulu, jangan cuma dipandangi.";
        return;
    }

    if (current < quiz.questions.length - 1) {
        current++;
        drawQuestion();
    } else {
        finish();
    }

};

// ============================
// RESULT
// ============================

function finish() {

    finalScore = answers.reduce((n,a,i) =>
        n + (a === quiz.questions[i].correct ? 1 : 0), 0
    );

    $("scoreText").textContent =
        finalScore + "/" + quiz.questions.length;

    $("resultTitle").textContent =
        "Hasil untuk " + quiz.owner;

    let v,d;

    if (finalScore >= 9) {
        v = "Wah, inner circle!";
        d = "Kamu mengenal " + quiz.owner +
            " dengan sangat baik. Memori kamu bukan kaleng-kaleng.";
    } else if (finalScore >= 7) {
        v = "Teman dekat detected ✦";
        d = "Kamu cukup mengenalnya. Ada beberapa detail kecil yang masih kelewat.";
    } else if (finalScore >= 4) {
        v = "Masih tahap pemanasan";
        d = "Lumayan, tapi masih ada banyak hal tentang " +
            quiz.owner + " yang belum kamu tahu.";
    } else {
        v = "Masih perlu banyak ngobrol";
        d = "Skornya belum tinggi. Bisa jadi belum terlalu kenal, atau pertanyaannya memang menjebak.";
    }

    $("verdict").textContent = v;
    $("resultDesc").textContent = d;

    $("progressBar").style.width = "100%";

    show("result");

}

$("shareResult").onclick = () => {

    const msg =
        `Hasil kuis Teman Sejati untuk ${quiz.owner}: ` +
        `${finalScore}/${quiz.questions.length} ` +
        `(${ $("verdict").textContent }).`;

    const url =
        "https://wa.me/?text=" + encodeURIComponent(msg);

    location.href = url;

};

$("restart").onclick = () => startTaking(quiz);

// ============================
// INITIALIZATION
// ============================

questions = defaults.map(x => ({
    text: x[0],
    options: [...x[1]],
    correct: x[2],
    chosen: false
}));

render();

const params = new URLSearchParams(location.search);
const quizID = params.get("q");

if (quizID) {
    loadQuiz(quizID);
} else {
    show("builder");
         }
