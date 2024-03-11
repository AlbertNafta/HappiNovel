const form1 = document.getElementById("form1");
const form2 = document.getElementById("form2");
const form3 = document.getElementById("form3");

function showContent(selectForm) {
  form1.style.display = "none";
  form2.style.display = "none";
  form3.style.display = "none";

  selectForm.style.display = "block";
}

const menuItems = [
  {
    content: `Thêm sách`,
    events: {
      click: (e) => {
        showContent(form1);
      }
    },
  },
  {
    content: `Thêm tập`,
    divider: "top-bottom", // top, bottom, top-bottom
    events: {
      click: (e) => {
        showContent(form2);
      }
    },
  },
  {
    content: `Thêm chương`,
    events: {
      click: (e) => {
        showContent(form3);
      }
    },
  },
];

const myMenu1 = new ContextMenu({
  target: ".target-light1",
  mode: "light",
  menuItems,
});

myMenu1.init();
