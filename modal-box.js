// @ts-check

const tmpl = document.createElement("template");
tmpl.innerHTML = `
   <style>
      :host {
         contain: content;
         overscroll-behavior-block: contain;
      }
      dialog {
         max-block-size: 85vh;
         inline-size: var(--inline-size, 75%);
         min-inline-size: 10rem;
         max-inline-size: var(--max-inline-size, 40rem);
         border: none;
         margin: revert; /* dialog centering depends on margins */
         padding: 0.25em 0.5em 1em  0.5em;
         border-radius: 10px;
         background-color: var(--bg-color, aliceblue);
      }
      dialog::backdrop {
         background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.8));
         animation: fade-in 0.5s;
      }

      header {
         font-weight: bold;
         border-block-end: 2px solid #c1c1c1;
         display: flex;
         align-items: center;
         justify-content: space-between;
      }

      #btn-close {
         block-size: 2rem;
         margin-inline-start: auto;
         padding-inline: 0.5em;
         border: none;
         outline: none;

         cursor: pointer;
         background-color: transparent;
         box-shadow: none;
      }
      #btn-close:hover {
         filter: contrast(130%);
         transform: scale(1.2);
         border-radius: 6px;
         background-color: lightgray;
      }

      article, footer {
         padding-inline: 1em;
      }

      @keyframes fade-in {
         from { opacity: 0; }
         to { opacity: 1; }
      }
   </style>

   <dialog part="dialog">
      <header part="header">
         <slot name="header"></slot>
         <button type="button" id="btn-close" title="Close">✖️</button>
      </header>

      <article part="article">
         <slot></slot>
      </article>

      <footer part="footer">
         <slot name="footer"></slot>
      </footer>
   </dialog>
`;

class DialogClosingSourcesEnum {
   // this enum indicates how a dialog box was closed
   static closeBtn = new DialogClosingSourcesEnum(0);
   static yesBtn = new DialogClosingSourcesEnum(2); // general: ok, yes, accept ...
   static noBtn = new DialogClosingSourcesEnum(3);  // general: no, refuse ...
   static cancelBtn = new DialogClosingSourcesEnum(4);
   static escKey = new DialogClosingSourcesEnum(5);
   static bgClick = new DialogClosingSourcesEnum(6);
   static closeFunc = new DialogClosingSourcesEnum(7);
   static others = new DialogClosingSourcesEnum(8);

   constructor(key) { this[key] = key; }
}

class ModalBox extends HTMLElement {
   #dialog;
   #openingData; // passed in when opening; NOT used internally, passed as is into modal-box-closed event
   #closingData; // passed in when closing; NOT used internally, passed as is into modal-box-closed event
   #closingSource; // to indicate the reason of closing or how it is closed, it's of type DialogClosingSourcesEnum

   constructor() {
      super();

      this.attachShadow({ mode: "open" });
      if (!this.shadowRoot) throw new ReferenceError("It seems that your environment does not support shadowRoot!");
      this.shadowRoot.appendChild(tmpl.content.cloneNode(true));

      const dialog = this.shadowRoot.querySelector("dialog");
      if (!dialog) throw new ReferenceError("This should never happen!");
      this.#dialog = dialog;

      // respond to different closing methods of the dialog
      this.shadowRoot.getElementById("btn-close")?.addEventListener("click", () => {
         this.#closingSource = DialogClosingSourcesEnum.closeBtn;
         this.#closingData = undefined;
         this.#dialog?.close();
      });

      this.#dialog?.addEventListener("cancel", () => {
         this.#closingSource = DialogClosingSourcesEnum.escKey;
         this.#closingData = undefined;
      });

      this.addEventListener("keydown", evt => {
         if (evt.key == "Escape") {
            this.#closingSource = DialogClosingSourcesEnum.escKey;
            this.#closingData = undefined;
         }
      });

      // this mutation observer is used to detect when the dialog is opened to dispatch "modal-box-opened" event
      const openMutObserver = new MutationObserver(mutList => {
         for (const aMut of mutList) {
            // @ts-ignore
            if (aMut.type == "attributes" && aMut.attributeName == "open" && aMut.target.hasAttribute("open")) {
               this.dispatchEvent(new CustomEvent("modal-box-opened", {
                  bubbles: true, composed: true,
                  detail: {
                     openingData: this.#openingData,
                  }
               }));
            }
         }
      });
      openMutObserver.observe(this.#dialog, {
         attributeFilter: ["open"],
      });

      // this event happens whenever the dialo is closed (whatever the closingSource is)
      this.#dialog.addEventListener("close", () => {
         this.dispatchEvent(new CustomEvent("modal-box-closed", {
            bubbles: true, composed: true,
            detail: {
               openingData: this.#openingData,
               closingData: this.#closingData,
               closingSource: this.#closingSource,
            }
         }));
      });
   }

   // calling code could pass openingData.
   /**
    * @param {any} openingData
    */
   showModal(openingData) {
      this.#dialog.showModal();
      this.style.display = "block";
      this.#openingData = openingData;
   }

   // code using the comp should call this mehod with correct closing source,
   // other code depends on the event modal-box-closed to take actions
   /**
    * @param {DialogClosingSourcesEnum} closingSource
    * @param {any} closingData
    */
   close(closingSource, closingData) {
      if (closingSource instanceof DialogClosingSourcesEnum) this.#closingSource = closingSource;
      else this.#closingSource = DialogClosingSourcesEnum.closeFunc;

      this.#closingData = closingData;
      this.#dialog.close();
   }
}

customElements.define("modal-box", ModalBox);

export default ModalBox;
export { DialogClosingSourcesEnum };
