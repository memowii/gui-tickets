"use strict";

// https://codeburst.io/node-js-mysql-and-promises-4c3be599909b 

let app = require('electron').remote;
let fs = require('fs');
let mysql = require('mysql');

class DB {
  constructor() {
    this.connection = new mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: 'gui_tickets'
    });
  }

  query(sql, args) {
    return new Promise((resolve, reject) => {
      this.connection.query(sql, args, (err, rows) => {
        if (err)
          return reject(err);
        resolve(rows);
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      this.connection.end(err => {
        if (err)
          return reject(err);
        resolve();
      });
    });
  }

  fetchTickets() {
    return new Promise((resolve, reject) => {
      this.connection.query('SELECT * FROM tickets WHERE esta_usado=1 UNION' + ' ' +
      'SELECT * FROM tickets WHERE esta_usado=0 ORDER BY consecutivo', (error, results) => {
        if (error) throw reject(error);
        resolve(results);
      });
    });
  }

  insertTicket(ticket) {
    return new Promise((resolve, reject) => {
      this.connection.query('INSERT INTO tickets SET ?', ticket, (error, result) => {
        if (error) throw reject(error); 
        resolve(result); 
      });
    });
  }

  insertTickets(tickets) {
    return new Promise((resolve, reject) => {
      this.connection.query('INSERT INTO tickets (consecutivo, esta_usado) VALUES ?', [tickets], (error, result) => {
        if (error) throw reject(error); 
        resolve(result); 
      });
    });
  }

  fetchTicket(id) {
    return new Promise((resolve, reject) => {
      this.connection.query('SELECT * FROM tickets WHERE id=?', [id], (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });
  }

  updateTicket(ticket) {
    return new Promise((resolve, reject) => {
      this.connection.query('UPDATE tickets SET consecutivo=?, esta_usado=? WHERE id=?', 
      [ticket.consecutivo, ticket.esta_usado, ticket.id], (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });
  }
}

DB.execute = function(callback) {
  const db = new DB();
  return callback(db).then(
      result => db.close().then(() => result),
      error => db.close().then(() => {throw error;})
  );
}

class Table {
  constructor(tableId) {
    this.tableId = tableId;
    this.table = document.getElementById(this.tableId);
  }

  addTickets(tickets) {

    Object.entries(tickets).forEach(([key, ticket]) => {
      let row = this.table.insertRow(++key);
      let numeroConsecutivoTicketCell = row.insertCell(0);
      let accionesCell = row.insertCell(1);
      let marcarDesmarTextContent = null;
      let usedTicketsAmount = this.countUsedTickets(tickets);

      numeroConsecutivoTicketCell.innerHTML = ticket.consecutivo;

      if (ticket.esta_usado) {
        numeroConsecutivoTicketCell.style.textDecoration = 'line-through';
        marcarDesmarTextContent = 'Desmarcar';
      } else {
        marcarDesmarTextContent = 'Marcar';
      }

      if (usedTicketsAmount === key) {
        numeroConsecutivoTicketCell.setAttribute('id', 'last');
      }

      accionesCell.innerHTML = `
        <div>
          <button class="copiar" type="button">Copiar</button>
          <button class="marcar-desmarcar" type="button" value="${ticket.id}">${marcarDesmarTextContent}</button>
        </div>`;
    });

    let copiarButtons = document.getElementsByClassName('copiar');
    for (let i = 0; i < copiarButtons.length; i++) {
      copiarButtons[i].addEventListener('click', function () {
        let tableData = this.parentElement.parentElement.parentElement.firstChild;
        let boardInput = document.getElementById('board-input');
        boardInput.value = tableData.textContent;
        boardInput.select();
        document.execCommand('copy');
      });
    }
  
    let marcarDesmarcarButtons = document.getElementsByClassName('marcar-desmarcar');
    for (let i = 0; i < marcarDesmarcarButtons.length; i++) {
      marcarDesmarcarButtons[i].addEventListener('click', function () {
        let consecutivoTableData = 
                  this.parentElement.parentElement.parentElement.firstChild;
        let ticket = {
          id: this.value,
          consecutivo: consecutivoTableData.textContent,
          esta_usado: null
        };

        if (this.textContent === 'Marcar') {
          ticket.esta_usado = 1;
        } else {
          ticket.esta_usado = 0;
        }

        DB.execute(db => db.updateTicket(ticket).then(() => {
          if (this.textContent === 'Marcar') {
            consecutivoTableData.style.textDecoration = 'line-through';
            this.innerHTML = 'Desmarcar';
          } else {
            consecutivoTableData.style.textDecoration = '';
            this.innerHTML = 'Marcar';
          }
        }));
      });
    }

    this.scrollToLastUsedTicket();
  }

  countUsedTickets(tickets) {
   let total = 0;
   for (let ticketIndx in tickets) {
     if (tickets[ticketIndx].esta_usado === 1) total++;
   }
   return total;
  }

  scrollToLastUsedTicket() {
    let aTag = document.createElement('a');
    aTag.setAttribute('href', '#last');
    aTag.innerHTML = 'temp';
    let body = document.getElementsByTagName('body')[0]
    body.appendChild(aTag);
    let anchor = document.getElementsByTagName('a')[0]
    anchor.click();
    anchor.parentNode.removeChild(anchor); 
  }
}

function populateDB() {
  let fileContent = fs.readFileSync('tickets-no-facturados-no-usados.txt', 'utf-8');
  let consecutivos = fileContent.split('\n'); 
  let tickets = [];

  Object.entries(consecutivos).forEach(([key, consecutivo]) => {
    // if used to avoid the "", but it didn't work.
    if (!consecutivo) return;

    let ticket = [consecutivo, false];
    if (Number(ticket[0]) <= 89340) ticket[1] = true;
    tickets.push(ticket);
  });

  DB.execute(db => db.insertTickets(tickets).then(result => {
    console.log(result);
  }));
}

function main() {
  let table = new Table('table-numero-consecutivo-ticket');
  DB.execute(db => db.fetchTickets().then(results => {
    table.addTickets(results);
  }));
}

main();