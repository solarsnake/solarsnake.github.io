// Simple terminal interface
const terminal = document.getElementById('terminal');
const inputField = document.getElementById('terminal-input');

function processCommand(command) {
  if (command === 'resume') {
    window.location.href = '/resume';
  } else if (command === 'blog') {
    window.location.href = '/blog';
  } else {
    terminal.innerHTML += `<div>Unknown command: ${command}</div>`;
  }
}

inputField.addEventListener('keypress', function(event) {
  if (event.key === 'Enter') {
    const command = inputField.value.trim();
    terminal.innerHTML += `<div>${command}</div>`;
    processCommand(command);
    inputField.value = '';
  }
});
