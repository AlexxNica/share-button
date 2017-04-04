/* Copyright 2017 Google Inc

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

class ShareButton extends HTMLElement {

  static get observedAttributes() {return ['href']; }

  constructor() {
    super();
    
    this.attachShadow({mode:'open'});
    this.shadowRoot.appendChild(this._createTemplate());
    
    let root = this.shadowRoot;

    this.shareBtn = root.getElementById('share-btn');
    this.overlay = root.getElementById('overlay');
    this.url = root.getElementById('url');
    this.copy = root.getElementById('copy');
    this.android = root.getElementById('android');
  }

  
  _createTemplate() {
    const framgent = document.createDocumentFragment();
      
    let styles = document.createElement('style');
    styles.innerHTML = `:host {
      display: inline-flex;
      --share-button-background: none;   
      --share-button-border: 2px outset buttonface;
      --share-button-appearance: button;
      --share-button-border-radius: initial;
      --share-button-color: initial;
      --overlay-background-color: white;
      --overlay-background-border: 1px solid #ccc;
      min-width: 25px;
      min-height: 25px;
    }
          
    .visible {
      display: block !important;
    }
    
    #share-btn {
      -webkit-appearance: var(--share-button-appearance);
      -moz-appearance: var(--share-button-appearance);
      appearance: var(--share-button-appearance);
      border: var(--share-button-border);
      border-radius: var(--share-button-border-radius);
      color: var(--share-button-color);
      width: 100%;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      flex-shrink: 1;
    }

    :host(:not(:empty)) #share-btn {
      background: var(--share-button-background);
    }

    :host(:empty) #share-btn, :host(.empty) #share-btn {
      --share-button-background: url(https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_share_black_24px.svg) center/18px no-repeat;
      background: var(--share-button-background);
    }
        
    #overlay {
      background-color: var(--overlay-background-color);
      display: none;
      padding: 1em;
      top: 0;
      margin: auto;
      left: 0;
      right: 0;
      max-width: 300px;
    }
    
    #overlay.visible {
      display: inline-block !important;
      border: var(--overlay-background-border);
      position: fixed;
    }
    
    #services {
      padding-left: 0;
    }
    
    #copy {
      display: none;
    }
    
    #copy.visible {
      display: block !important;
    }
    
    #copy {
      height: 25px;
      width: 25px;
      margin: 0 0 0 0.5em;
      padding: 1em;
    }

    #copy img {
      transform: translate(-50%, -50%);
    }
    
    #android {
      display: none;
      height: 25px;
      width: 25px;
      margin: 0 0 0 0.5em;
      padding: 1em;
    }

    #android img {
      transform: translate(-50%, -50%);
    }
    
    div.buttons {
      overflow-x: auto;
      max-height: 2em;
      display: flex;
      flex-direction: row;
    }
    
    slot[name=buttons] {
      min-height: 1em;
      background-color: red;
    }

    slot[name=clipboard]::slotted(*) {
      transform: translate(-50%, -50%);
      width: 100%;
      height: 100%;
    }

    slot[name=android]::slotted(*) {
      transform: translate(-50%, -50%);
      width: 100%;
      height: 100%;
    }

    slot[name=buttons]:empty {
      display: none;
    }
                    
    #android.visible {
      display: block !important;
    }
    
    #urlbar {
      display: flex;
      flex-direction: row;
      align-items: center;
    }
    
    #url {
      width: 100%;
      padding: 0.5em 0.5em;
    }`;

    const button = document.createElement('button');
    button.id='share-btn';
    button.innerHTML='<slot></slot>';
    
    const overlay = document.createElement('div');
    overlay.id = 'overlay';
    overlay.innerHTML = `
      <div id="urlbar">
        <input type="url" id="url" />
        <button id="copy" aria-label="Copy to clipboard"><slot name="clipboard"><img src="https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_content_copy_black_24px.svg"></slot></button>
        <button id="android" aria-label="Share on Android"><slot name="android"><img src="https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_android_black_24px.svg"></slot></button>  
      </div>
      <div class="buttons">
        <slot name="buttons"></slot>
      </div>`;

    framgent.appendChild(styles);
    framgent.appendChild(button);
    framgent.appendChild(overlay);
    
    return framgent;
  }

  _childrenAdded() {
    // Check to see if it is empty and apply class
    let childNodeCount = this.children.length;
    let slotElementCount = this.querySelectorAll('[slot]').length;

    if(childNodeCount == slotElementCount && childNodeCount > 0) {
      this.classList.add('empty');
    }
    else {
      this.classList.remove('empty');
    }
  }

  connectedCallback() {
    let root = this.shadowRoot;

    // This check is needed because sometimes all the nodes are already here.
    this._childrenAdded();
    let observer = new MutationObserver(this._childrenAdded.bind(this));
    observer.observe(this, {childList: true});  

    // Handle click events on the main element.
    this.addEventListener('click', e => {
      e.preventDefault();
      this.toggleOverlay();
      return false;
    }, false);
    
    // Dismiss the overlay on any keypress.
    this.addEventListener('keypress', e => this.toggleOverlay());
    
    // Dismiss the overlay on any interaction on the page

    document.documentElement.addEventListener('click', e => {
      if(e.target != root.host){
        this.hide();
      }
    }, true);
        
    this.copy.addEventListener('click', e => {
      e.stopPropagation();
      e.preventDefault();
      e.cancelBubble = true;
      
      this.copyUrl();
    });
    
    this.android.addEventListener('click', e => {
      const fallbackUrl = encodeURIComponent("https://twitter.com/intent/tweet");
      
      window.location = `intent:#Intent;action=android.intent.action.SEND;type=text/plain;S.android.intent.extra.TEXT=${encodeURIComponent(this.url.value)};S.android.intent.extra.SUBJECT=${document.title};S.browser_fallback_url=${fallbackUrl}?text=${encodeURIComponent(document.title)}&${encodeURIComponent(window.location)};end`;
    });     
    
    if(navigator.userAgent.indexOf('Android') > 0) {
      this.android.classList.add('visible');
    }
        
    this.url.addEventListener('click', e => {

      e.stopPropagation();
      e.preventDefault();
      e.cancelBubble = true;
      
      return false;
    }, false);
    
    this.url.addEventListener('keypress', e => {
      e.stopPropagation();
      e.cancelBubble = true;
      
      if(e.charCode == 13) {
        window.location = e.currentTarget.value;
      }
    });

    window.addEventListener('hashchange', e => this.updateUrl(window.location));
    window.addEventListener('popstate', e => this.updateUrl(window.location));

    if(!!this.href == false) {
      this.href = window.location;
    }
    
    this.updateUrl(this.href);
    
    if(document.queryCommandSupported && document.queryCommandSupported('copy')) {
        this.copy.classList.toggle('visible');
    }
  }

  attributeChangedCallback(attr, oldValue, newValue) {
    if (attr == 'href' && oldValue != newValue) {
      this.href = newValue;
    }
  }

  get href() {
    return this.getAttribute('href');
  }

  set href(val) {
    if(val) {
      this.updateUrl(val);
      this.setAttribute('href', val);
    } else {
      this.updateUrl(window.location);
      this.removeAttribute('href');
    }
  }

  updateUrl(url) {
    this.url.value = url;
  }
  
  copyUrl() {
    window.getSelection().removeAllRanges();
    
    const range = document.createRange();
    range.selectNode(this.url);
    window.getSelection().addRange(range);
    
    try {
      const result = document.execCommand('copy');
      window.getSelection().removeAllRanges();
      this.toggleOverlay();
      return result;
    }
    catch(error) {
      console.error(error);
    }
    
    return false;
  }
  
  hide() {
    this.overlay.classList.remove('visible');
  }
  
  show() {
     this.overlay.classList.add('visible');
  }
 
  toggleOverlay () {
    // User has clicked on the Share button
    this.overlay.classList.toggle('visible');
  }
  
};

customElements.define('share-button', ShareButton);