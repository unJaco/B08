/* T9 Chess demo — a keypad phone mockup whose D-pad drives a cursor over a real
 * chess game. Move legality, check / checkmate / stalemate are handled by
 * chess.js; both sides are played locally (Stufe B). No backend.
 *
 * Board display coordinates: row 0 = rank 8 (top), row 7 = rank 1 (bottom);
 * col 0 = file a (left), col 7 = file h (right) — i.e. White's perspective.
 */
(function () {
  "use strict";

  var GLYPH = { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" };
  var FILES = "abcdefgh";

  function rcToSquare(r, c) {
    return FILES[c] + (8 - r);
  }

  function init(root) {
    if (root.dataset.t9Init) return;
    root.dataset.t9Init = "1";

    var Ctor =
      typeof Chess !== "undefined" ? Chess.Chess || Chess : null;
    if (!Ctor) {
      root.querySelector("[data-status]").textContent =
        "chess engine failed to load";
      return;
    }

    var game = new Ctor();
    var boardEl = root.querySelector("[data-board]");
    var statusEl = root.querySelector("[data-status]");
    var phone = root.querySelector(".t9-phone");

    var cursor = { row: 6, col: 4 }; // start on e2
    var selected = null; // square string, e.g. "e2"
    var targets = []; // legal destination squares for the selected piece

    // build the 64 cells once
    var cells = [];
    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        var cell = document.createElement("div");
        cell.className =
          "t9-sq " + ((r + c) % 2 === 0 ? "t9-sq--light" : "t9-sq--dark");
        cell.dataset.row = r;
        cell.dataset.col = c;
        boardEl.appendChild(cell);
        cells.push(cell);
      }
    }

    function selectSquare(sq) {
      selected = sq;
      targets = game.moves({ square: sq, verbose: true }).map(function (m) {
        return m.to;
      });
    }

    function clearSelection() {
      selected = null;
      targets = [];
    }

    function pressOk() {
      if (game.game_over()) return;
      var sq = rcToSquare(cursor.row, cursor.col);
      var piece = game.get(sq);

      if (selected) {
        if (sq === selected) {
          clearSelection();
        } else if (targets.indexOf(sq) !== -1) {
          game.move({ from: selected, to: sq, promotion: "q" });
          clearSelection();
        } else if (piece && piece.color === game.turn()) {
          selectSquare(sq); // switch to another of your pieces
        } else {
          clearSelection();
        }
      } else if (piece && piece.color === game.turn()) {
        selectSquare(sq);
      }
      render();
    }

    function moveCursor(dir) {
      if (dir === "up" && cursor.row > 0) cursor.row--;
      else if (dir === "down" && cursor.row < 7) cursor.row++;
      else if (dir === "left" && cursor.col > 0) cursor.col--;
      else if (dir === "right" && cursor.col < 7) cursor.col++;
      render();
    }

    function render() {
      var board = game.board(); // board[0] === rank 8 === display row 0
      var turn = game.turn();
      for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
          var cell = cells[r * 8 + c];
          var piece = board[r][c];
          var sq = rcToSquare(r, c);
          cell.textContent = piece ? GLYPH[piece.type] : "";
          cell.classList.toggle("t9-sq--white", !!piece && piece.color === "w");
          cell.classList.toggle("t9-sq--black", !!piece && piece.color === "b");
          cell.classList.toggle(
            "is-cursor",
            cursor.row === r && cursor.col === c
          );
          cell.classList.toggle("is-selected", selected === sq);
          cell.classList.toggle("is-target", targets.indexOf(sq) !== -1);
          cell.classList.remove("is-check");
        }
      }
      if (game.in_check() && !game.in_checkmate()) {
        markKing(board, turn);
      } else if (game.in_checkmate()) {
        markKing(board, turn);
      }
      renderStatus();
    }

    function markKing(board, color) {
      for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
          var p = board[r][c];
          if (p && p.type === "k" && p.color === color) {
            cells[r * 8 + c].classList.add("is-check");
          }
        }
      }
    }

    function renderStatus() {
      var side = game.turn() === "w" ? "White" : "Black";
      var msg, over = true;
      if (game.in_checkmate()) {
        msg = "Checkmate — " + (game.turn() === "w" ? "Black" : "White") + " wins";
      } else if (game.in_stalemate()) {
        msg = "Stalemate — draw";
      } else if (game.in_draw()) {
        msg = "Draw";
      } else {
        over = false;
        msg = side + " to move" + (game.in_check() ? " · check" : "");
      }
      statusEl.textContent = msg;
      statusEl.classList.toggle("is-over", over);
    }

    // --- input ------------------------------------------------------------
    root.querySelectorAll("[data-dir]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var d = btn.dataset.dir;
        if (d === "ok") pressOk();
        else moveCursor(d);
        phone.focus();
      });
    });

    phone.addEventListener("keydown", function (e) {
      var map = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
      };
      if (map[e.key]) {
        e.preventDefault();
        moveCursor(map[e.key]);
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        pressOk();
      }
    });

    root.querySelector("[data-reset]").addEventListener("click", function () {
      game.reset();
      clearSelection();
      cursor = { row: 6, col: 4 };
      render();
      phone.focus();
    });

    render();
  }

  function boot() {
    document.querySelectorAll("[data-t9-demo]").forEach(init);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
