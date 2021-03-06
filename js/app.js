// SERVICE WORKERS
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('./sw.js')
    .catch(function(err) {
      console.log(err);
    });
}

// SETTINGS
const default_alphabet = ('ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz'.split(''));

// INTERFACE

const main_page = document.querySelector('.main-page');
const key_page = document.querySelector('.key-page');
const results_page = document.querySelector('.results-page');

const message_textarea = document.getElementById('messageInput');
const key_textarea = document.getElementById('keyInput');
const output_textarea = document.getElementById('messageOutput');

const encrypt_button = document.getElementById('btnEncrypt');
const decrypt_button = document.getElementById('btnDecrypt');
const submit_button = document.getElementById('btnSubmit');
const received_button = document.getElementById('btnReceived');

// ROTORS DEFINITION
class Rotor {
  constructor(key, type = 0) {
    this.type = type;
    this.set_key(key);
    this.set_alphabet();
    this.set_encryptor();
    this.set_decryptor();
    this.set_inserted_letters_number();
  }

  set_inserted_letters_number(letters = 0) {
    this.inserted_letters = letters;
  }

  set_key(key) {
    if (!this.is_special(key)) {
      this.key = key;
      this.index = default_alphabet.indexOf(this.key);
      this.set_alphabet();
      this.set_encryptor();
      this.set_decryptor();
      this.set_inserted_letters_number();
    }
  }

  set_index(index) {
    if (index > this.alphabet.length - 1) {
      this.index = 0;
    } else if (index < 0) {
      this.index = this.alphabet.length - 1;
    } else {
      this.index = index;
    }
    this.key = default_alphabet[this.index];
    this.set_alphabet();
    this.set_encryptor();
    this.set_decryptor();
    this.set_inserted_letters_number();
  }

  set_alphabet() {
    const alphabet_first = default_alphabet.slice(this.index);
    const alphabet_second = default_alphabet.slice(0, this.index);
    const alphabet = [...alphabet_first, ...alphabet_second];

    this.index =  default_alphabet.indexOf(this.key);
    this.alphabet = alphabet;
  }

  set_encryptor() {
    this.encryptor = {};
    default_alphabet.forEach(letter => {
      this.encryptor[letter] = this.alphabet[default_alphabet.indexOf(letter)];
    });
  }

  set_decryptor() {
    this.decryptor = {};
    this.alphabet.forEach(letter => {
      this.decryptor[letter] = default_alphabet[this.alphabet.indexOf(letter)];
    });
  }

  get_current_key() {
    return this.key;
  }

  get_current_index() {
    return this.index;
  }

  get_current_alphabet() {
    return this.alphabet;
  }

  get_encryptor() {
    return this.encryptor;
  }

  get_decryptor() {
    return this.decryptor;
  }

  get_inserted_letters_number() {
    return this.inserted_letters;
  }

  rotate_rotor() {
    if ((this.get_inserted_letters_number() + 1) >= Math.pow(this.alphabet.length, this.type)) {
      this.set_index(this.index + 1);
    } else {
      this.set_inserted_letters_number(this.get_inserted_letters_number() + 1);
    }
  }

  encrypt_letter(letter) {
    if (this.is_special(letter)) {
      return this.is_special(letter);
    }
    const encrypted_letter = this.encryptor[letter];
    this.rotate_rotor();
    return encrypted_letter;
  }

  decrypt_letter(letter) {
    if (this.is_special(letter)) {
      return this.is_special(letter);
    }
    const decrypted_letter = this.decryptor[letter];
    this.rotate_rotor();
    return decrypted_letter;
  }

  is_special(letter) {
    if (default_alphabet.includes(letter)) {
      return false;
    } else {
      return letter;
    }
  }

}

// ENIGMA

class Enigma {
  constructor(key_input) {
    const rotor_key = key_input.split('').splice(0, 3);
    this.r1 = new Rotor(rotor_key[0]);
    this.r2 = new Rotor(rotor_key[1], 1);
    this.r3 = new Rotor(rotor_key[2], 2);

    let key_unique = [...new Set(key_input.split(''))];
    key_unique = key_unique.filter((el) => {
      if (default_alphabet.includes(el)) {
        return true;
      } else {
        return false;
      }
    });
    if (key_unique.length % 2 !== 0) {
      key_unique.pop();
    }
    let plugborard_array = [];
    key_unique.forEach((l, i) => {
      if (i % 2 === 0) {
        plugborard_array.push([l]);
      } else {
        plugborard_array[plugborard_array.length-1][1] = l;
      }
    });
    let plugboard = {};
    plugborard_array.forEach(el => {
      plugboard[el[0]] = el[1];
      plugboard[el[1]] = el[0];
    });
    this.plugboard = plugboard;
  }

  encrypt_letter(l) {
    let l1 = l;
    if (this.plugboard[l]) {
      l1 = this.plugboard[l1];
    }
    const l2 = this.r1.encrypt_letter(l1);
    const l3 = this.r2.encrypt_letter(l2);
    const l4 = this.r3.encrypt_letter(l3);
    let l5 = l4;
    if (this.plugboard[l4]) {
      l5 = this.plugboard[l4];
    }
    return l5;
  }

  decrypt_letter(l) {
    let l1 = l;
    if (this.plugboard[l]) {
      l1 = this.plugboard[l1];
    }
    const l2 = this.r1.decrypt_letter(l1);
    const l3 = this.r2.decrypt_letter(l2);
    const l4 = this.r3.decrypt_letter(l3);
    let l5 = l4;
    if (this.plugboard[l4]) {
      l5 = this.plugboard[l4];
    }
    return l5;
  }

  encrypt_words(text) {
    const textArray = text.split('');
    const cryptedArray = textArray.map(letter => this.encrypt_letter(letter));
    return cryptedArray.join('');
  }

  decrypt_words(text) {
    const textArray = text.split('');
    const cryptedArray = textArray.map(letter => this.decrypt_letter(letter));
    return cryptedArray.join('');
  }

  reset() {
    this.r1.set_key('A');
    this.r2.set_key('A');
    this.r3.set_key('A');
  }
}

// APP


let text_input;
let enigma;
let output;
let criptMode;

encrypt_button.addEventListener('click', () => {
  if (message_textarea.value) {
    text_input = message_textarea.value;
    main_page.style.display = 'none';
    key_page.style.display = 'block';
    message_textarea.value = '';
    criptMode = 'Encrypt';
  }
});

decrypt_button.addEventListener('click', () => {
  if (message_textarea.value) {
    text_input = message_textarea.value;
    main_page.style.display = 'none';
    key_page.style.display = 'block';
    message_textarea.value = '';
    criptMode = 'Decrypt';
  }
});

submit_button.addEventListener('click', () => {
  if (key_textarea.value) {
     const key_input = key_textarea.value;
     enigma = new Enigma(key_input);
     key_page.style.display = 'none';
     key_textarea.value = '';
     results_page.style.display = 'block';
     if (criptMode === 'Encrypt') {
       output_textarea.innerText = enigma.encrypt_words(text_input);
     } else if (criptMode === 'Decrypt') {
       output_textarea.innerText = enigma.decrypt_words(text_input);
     } else {
       output_textarea.innerText = 'Internal error';
     }
  }
})

received_button.addEventListener('click', () => {
  results_page.style.display = 'none';
  main_page.style.display = 'block';
  enigma.reset();
})
