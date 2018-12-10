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
      this.connection.query('SELECT * FROM tickets', (error, results) => {
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

      numeroConsecutivoTicketCell.innerHTML = ticket.consecutivo;
      if (ticket.esta_usado) numeroConsecutivoTicketCell.style.textDecoration = 'line-through';
      accionesCell.innerHTML = `<div>
      <button class="copiar" type="button">Copiar</button>
      <button class="marcar" type="button" value="${ticket.id}">Marcar</button>
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
      marcarButton.addEventListener('click', function () {
        let consecutivoTableData = 
                  this.parentElement.parentElement.parentElement.firstChild;
        let ticket = {
          id: this.value,
          consecutivo: consecutivoTableData.textContent,
          esta_usado:
              consecutivoTableData.style.textDecoration !== 'line-through' ? 1 : 0
        };

        DB.execute(db => db.updateTicket(ticket).then(() => {
          consecutivoTableData.style.textDecoration = 'line-through';
        }));
      });
    });
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