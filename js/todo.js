const todo = {
  tpl: null,

  // 작업 목록
  items: [],

  // DOMLoaded시 가장 먼저 호출할 예정
  init() {
    // 초기에 실행할 영역

    // 템플릿 HTML 추출
    this.tpl = document.getElementById("tpl").innerHTML;
  },

  // 작업 등록
  add(title, description, deadline) {
    // RUD 위한 내부적 일련 번호 발급
    // epoch type, 1/1000 시간으로 절대 중복되지 않음
    const seq = Date.now();

    this.items.push({ seq, title, description, deadline, done: false });

    // 작업 등록 후 화면 갱신
    this.render();
  },

  // 작업 삭제
  remove(seq) {
    // seq로 작업 목록 순서 번호(index) 조회
    const index = this.items.findIndex((item) => item.seq === seq);

    // splice 메서드로 해당 순서 번호 항목 제거
    this.items.splice(index, 1);

    // 작업 삭제 후 화면 갱신
    this.render();
  },

  // 작업 목록 출력 & 갱식
  render() {
    const itemsEl = document.querySelector(".items");

    itemsEl.innerHTML = "";

    const domParser = new DOMParser();

    for (const { seq, title, description, deadline } of this.items) {
      // tpl 호출 후 #{...}을 치환
      let html = this.tpl;
      html = html
        .replace(/#{seq}/g, seq)
        .replace(/#{title}/g, title)
        // 줄개행이 안돼서 \n -> <br> 변환
        .replace(/#{description}/g, description.replace(/\n/g, "<br>"))
        .replace(/#{deadline}/g, deadline);

      const dom = domParser.parseFromString(html, "text/html");

      // 추가된 할 일 li 태그를 선택해 DOM 객체로 변환
      const itemEl = dom.querySelector("li");

      itemsEl.append(itemEl);

      const titWrapEl = itemEl.querySelector(".tit-wrap");

      titWrapEl.addEventListener("click", function () {
        todo.accodianView(this.parentElement);
      });
    }
  },

  accodianView(el) {
    const items = document.querySelectorAll(".items > .item");

    items.forEach((item) => item.classList.remove("on"));

    // 기존 on을 제거하고 el 에만 on 추가
    el.classList.add("on");
  },
};

window.addEventListener("DOMContentLoaded", function () {
  // 초기화
  todo.init();

  // 양식 태그의 기본 동작 차단
  // 양식 제출해도 값이 남아있도록 하기 위해
  // 첫번째 매개 변수는 Event 객체로 고정, 관례적으로 e, ev 사용
  frmTodo.addEventListener("submit", function (e) {
    // 기본 동작 차단
    e.preventDefault();

    /**
     * 0. 검증 실패 메세지 출력화면 초기화
     * 1. 필수 항목(field명 : errormessage) 검증 + 마감일 유효성 검사
     * 2. 검증 성공시 일정 추가
     * 3. 양식 초기화
     *
     */

    try {
      /* 0. 검증 실패 메세지 출력화면 초기화 S */

      const errors = document.getElementsByClassName("error");

      for (const el of errors) {
        // dn class가 없으면 추가하고 메세지 지워주기

        el.innerText = "";

        if (!el.classList.contains("dn")) {
          el.classList.add("dn");
        }
      }

      /* 0. 검증 실패 메세지 출력화면 초기화 E */

      // Data 가공용 선언
      const formData = {};

      /* 1. 필수 항목(field명 : errormessage) 검증 + 마감일 유효성 검사 S */
      const requiredFields = {
        title: "작업 제목을 입력하세요.",
        deadline: "마감임을 입력하세요.",
        description: "작업 내용을 입력하세요.",
      };

      // entries = Key & Value 쌍
      for (const [field, message] of Object.entries(requiredFields)) {
        const value = frmTodo[field].value.trim();

        if (!value) {
          throw new Error(JSON.stringify({ field, message }));
        }

        // 마감일인 경우 현재 날짜보다 이전은 될 수 없음
        if (field === "deadline" && new Date(value) - new Date() < 0) {
          throw new Error(
            JSON.stringify({ field, message: "현재 날짜 이후로 입력하세요." })
          );
        }

        // 입력 Data 항목 추가
        formData[field] = value;
      }
      /* 1. 필수 항목(field명 : errormessage) 검증 + 마감일 유효성 검사 E */

      // 2. 검증 성공시 일정 추가

      // 비구조 할당으로 분해
      const { title, deadline, description } = formData;

      todo.add(title, description, deadline);

      // 3. 양식 초기화
      frmTodo.title.value = "";
      frmTodo.deadline.value = "";
      frmTodo.description.value = "";

      frmTodo.title.focus();
    } catch (err) {
      // 비구조 할당
      const { field, message } = JSON.parse(err.message);

      const el = document.getElementById(`error-${field}`);

      if (el) {
        el.innerText = message;

        el.classList.remove("dn");

        el.focus();
      }
    }
  });
});
