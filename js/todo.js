const todo = {
  tpl: null,

  // 작업 목록
  items: [],

  // 검색된 작업 목록 (원본 데이터 보존 위해 분리)
  itemsSearched: null,

  // DOMLoaded시 가장 먼저 호출할 예정
  init() {
    // 초기에 실행할 영역

    // 템플릿 HTML 추출
    this.tpl = document.getElementById("tpl").innerHTML;

    /**
     * 1. localStorage에 저장된 작업 목록 조회
     * 2. 직렬화된 Data 다시 JSON화 렌더링해 출력
     */
    const data = localStorage.getItem("todos");

    // 최초 실행시 localStorage에 Data가 없을 경우 대비
    if (data) {
      this.items = JSON.parse(data);
    }

    this.render();
  },

  // 작업 등록
  add(title, description, deadline) {
    // RUD 위한 내부적 일련 번호 발급
    // epoch type, 1/1000 시간으로 절대 중복되지 않음
    const seq = Date.now();

    this.items.push({ seq, title, description, deadline, done: false });

    // 추가된 작업 localStorage에 저장
    this.save();

    // 작업 등록 후 화면 갱신
    this.render();
  },

  // 작업 삭제
  remove(seq) {
    // seq로 작업 목록 순서 번호(index) 조회
    const index = this.items.findIndex((item) => item.seq === seq);

    // splice 메서드로 해당 순서 번호 항목 제거
    this.items.splice(index, 1);

    // 작업 목록 localStorage에 저장
    this.save();

    // 작업 삭제 후 화면 갱신
    this.render();
  },

  // 작업 목록 출력 & 갱식
  render() {
    const itemsEl = document.querySelector(".items");

    itemsEl.innerHTML = "";

    const domParser = new DOMParser();

    const items = this.itemsSearched ? this.itemsSearched : this.items;

    for (const { seq, title, description, deadline, done } of items) {
      // tpl 호출 후 #{...}을 치환
      let html = this.tpl;

      const checkedTrue = done ? " checked" : "";

      const checkedFalse = done ? "" : " checked";

      html = html
        // 치환 코드 (권장)
        .replace(/#{seq}/g, seq)
        .replace(/#{title}/g, title)
        // 줄개행이 안돼서 \n -> <br> 변환
        .replace(/#{description}/g, description.replace(/\n/g, "<br>"))
        .replace(/#{deadline}/g, deadline)
        .replace(/#{checkedTrue}/g, checkedTrue)
        .replace(/#{checkedFalse}/g, checkedFalse)
        .replace(/#{addClass}/g, done ? " done" : "");

      const dom = domParser.parseFromString(html, "text/html");

      // 추가된 할 일 li 태그를 선택해 DOM 객체로 변환
      const itemEl = dom.querySelector("li");

      itemsEl.append(itemEl);

      const titWrapEl = itemEl.querySelector(".tit-wrap");

      titWrapEl.addEventListener("click", function () {
        todo.accodianView(this.parentElement);
      });

      // 삭제 처리
      const removeEl = itemEl.querySelector(".remove");
      removeEl.addEventListener("click", function () {
        if (confirm("정말 삭제하겠습니까?")) {
          todo.remove(seq);
        }
      });

      // 작업 완료, 작업중 처리
      // name이 done으로 시작하는 모든 input 선택
      const doneEls = document.getElementsByName(`done_${seq}`);

      const itemIndex = this.items.findIndex((item) => item.seq === seq);

      for (const el of doneEls) {
        el.addEventListener("click", function () {
          const done = this.value === "true";
          todo.items[itemIndex].done = done;
          todo.render();
          todo.save();
        });
      }
    }
  },

  accodianView(el) {
    const items = document.querySelectorAll(".items > .item");

    items.forEach((item) => item.classList.remove("on"));

    // 기존 on을 제거하고 el 에만 on 추가
    el.classList.add("on");
  },

  /**
   * items(할 일 목록)을 LocalStorage로 저장
   *
   */
  save() {
    // Value 값은 문자열만 가능하기 때문에 직렬화
    const data = JSON.stringify(this.items);

    // todos = Key, data = Value
    localStorage.setItem("todos", data);

    this.itemsSearched = null;

    frmSearch.skey.value = "";
  },

  // 정렬
  sort(field, order) {
    this.items.sort((item1, item2) => {
      switch (field) {
        case "deadline":
          let gap = new Date(item2.deadline) - new Date(item1.deadline);

          return order === "desc" ? gap : -gap;

        default:
          return order === "desc"
            ? item2.seq - item1.seq
            : item1.seq - item2.seq;
      }
    });
    this.render();
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

  /* 할 일 목록 정렬 처리 S */

  frmSearch.sort.addEventListener("change", function () {
    const [field, order] = this.value.split("_");

    todo.sort(field, order);
  });

  /* 할 일 목록 정렬 처리 E */

  /* 키워드 검색 처리 S */

  frmSearch.skey.addEventListener("change", function () {
    const skey = this.value.trim();

    todo.itemsSearched = skey
      ? todo.items.filter(
          ({ title, description }) =>
            title.includes(skey) || description.includes(skey)
        )
      : null;

    todo.render();
  });

  /* 키워드 검색 처리 E */
});
