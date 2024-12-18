const todo = {
  // 작업 목록
  items: [],

  // 작업 등록
  add(title, description, deadline) {
    // RUD 위한 내부적 일련 번호 발급
    // 1/1000 시간으로 절대 중복되지 않음
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
  render() {},
};

window.addEventListener("DOMContentLoaded", function () {
  // 양식 태그의 기본 동작 차단
  // 양식 제출해도 값이 남아있도록 하기 위해

  // 첫번째 매개 변수는 Event 객체로 고정, 관례적으로 e, ev 사용
  frmTodo.addEventListener("submit", function (e) {
    // 기본 동작 차단
    e.preventDefault();

    /**
     * 1. 필수 항목(field명 : errormessage) 검증
     * 2. 검증 성공시 일정 추가
     * 3.
     */

    try {
      /* 1. 필수 항목(field명 : errormessage) 검증 S */
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
      }
      /* 1. 필수 항목(field명 : errormessage) 검증 E */
    } catch (err) {
      // 비구조 할당
      const { field, message } = JSON.parse(err.message);

      const el = document.getElementById(`error-${field}`);

      console.log(err, message, el);

      if (el) {
        el.innerText = message;

        el.classList.remove("dn");

        el.focus();
      }
    }
  });
});
