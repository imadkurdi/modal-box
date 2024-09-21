
const userA = {
   name: "AAA",
   age: 22
};
const userB = {
   name: "BBB",
   age: 33
};

const btnA = document.getElementById("btn-del-a");
const btnB = document.getElementById("btn-del-b");
if (!btnA || !btnB) throw new ReferenceError("This should never happen!");
btnA.textContent = `Delete user ${userA.name}`;
btnB.textContent = `Delete user ${userB.name}`;

const main = document.querySelector("main");
const box = document.querySelector("modal-box");
if (!main || !box) throw new ReferenceError("This should never happen!");


document.getElementById("btn-info")?.addEventListener("click", () => {
   main.textContent = "";

   const infoBox = document.createElement("modal-box");
   infoBox.appendChild(document.getElementById("tmpl-info")?.content.cloneNode(true));
   infoBox.className = "info-box";

   infoBox.addEventListener("modal-box-closed", () => {
      main.textContent = "Info dialog box showed then closed";
      infoBox.remove();
   });

   const btnOk = infoBox.querySelector("button");
   if (!btnOk) throw new ReferenceError("This should never happen");

   btnOk.addEventListener("click", () => infoBox.close());

   document.body.appendChild(infoBox);
   infoBox.showModal();
   btnOk.focus();
});

//**************************************

btnA.addEventListener("click", () => showDeleteConfirmation(userA));
btnB.addEventListener("click", () => showDeleteConfirmation(userB));

function showDeleteConfirmation(userObj) {
   main.textContent = "";
   box.querySelector("#user-info").textContent = `${userObj.name}, ${userObj.age} years old`;
   box.showModal(userObj);
   box.querySelector("button[data-action=no]")?.focus();
}

box.querySelectorAll("[slot=footer] button").forEach(btn => btn.addEventListener("click", evt => {
   box.close(8, evt.target.dataset.action);
}));

box.addEventListener("modal-box-closed", evt => {
   if (evt.detail.closingData == "delete") {
      main.textContent = `User ${evt.detail.openingData.name}, ${evt.detail.openingData.age} years old: deleted!`;
   }
   else {
      main.textContent = `User ${evt.detail.openingData.name}: deletion is aborted!`;
   }
});
