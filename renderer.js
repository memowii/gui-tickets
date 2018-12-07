let app = require('electron').remote;
let fs = require('fs');

function fillTable(tickets, areUsed = false) {
  let table = document.getElementById('table-numero-consecutivo-ticket');

  Object.entries(tickets).forEach(([key, value]) => {
    let row = table.insertRow(1);
    let numeroConsecutivoTicketCell = row.insertCell(0);
    let accionesCell = row.insertCell(1);

    numeroConsecutivoTicketCell.innerHTML = value;
    if (areUsed) {
      numeroConsecutivoTicketCell.style.textDecoration = 'line-through';
    }
    accionesCell.innerHTML = `<div>
    <button class="copiar" type="button">Copiar</button>
    <button class="marcar" type="button">Marcar</button>
    </div>`;
  }); 

  let copiarButtons = document.getElementsByClassName('copiar');
  Object.entries(copiarButtons).forEach(([key, copiarButton]) => {
    copiarButton.addEventListener('click', function () {
      let tableData = this.parentElement.parentElement.parentElement.firstChild;
      let boardInput = document.getElementById('board-input');
      boardInput.value = tableData.textContent;
      boardInput.select();
      document.execCommand('copy');
    });
  });
  
  let marcarButtons = document.getElementsByClassName('marcar');
  Object.entries(marcarButtons).forEach(([key, marcarButton]) => {
    marcarButton.addEventListener('click', function() {
      let tableData = this.parentElement.parentElement.parentElement.firstChild;
      tableData.style.textDecoration = 'line-through';
    });
  });
}

function readFileUsedTickets(filePath) {
  fs.readFile(filePath, 'utf-8', function (err, data) {
    if (err) {
      throw "Error while opening file.";
    }

    addUsedTickets(data);
  });
}

function readFileUnusedTickets(filePath) {
  fs.readFile(filePath, 'utf-8', function (err, data) {
    if (err) {
      throw "Error while opening file.";
    }

    addUnusedTickets(data);
  });
}

function addUsedTickets(readTicketsFromFile) {
  let tickets = readTicketsFromFile.split('\n');
  fillTable(tickets, true);
}

function addUnusedTickets(readTicketsFromFile) {
  let tickets = readTicketsFromFile.split('\n');
  fillTable(tickets, false);
}



readFileUnusedTickets('./tickets-no-facturados-no-usados.txt');
readFileUsedTickets('./tickets-no-facturados-usados.txt');