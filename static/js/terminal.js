// Simple terminal interface
const terminal = document.getElementById('terminal');
const inputField = document.getElementById('terminal-input');
const existingSpans = terminal.querySelectorAll('span');
const promptSymbol = existingSpans.length > 0 ? existingSpans[0].cloneNode(true) : document.createElement('span');
if (!existingSpans.length) promptSymbol.textContent = '> ';


function addTerminalLine(text, isCommand = false) {
    const line = document.createElement('div');
    if (isCommand) {
        const commandPrompt = promptSymbol.cloneNode(true);
        line.appendChild(commandPrompt);
        line.append(text); // Append text directly after the prompt
    } else {
        line.textContent = text;
    }
    // Insert before the input field's parent div
    inputField.parentElement.before(line);
}

function processCommand(command) {
  const lowerCommand = command.toLowerCase();
  addTerminalLine(command, true); // Display the command entered

  switch (lowerCommand) {
    case 'help':
      addTerminalLine("Available commands:");
      addTerminalLine("- resume: View my resume");
      addTerminalLine("- about: Learn more about me");
      addTerminalLine("- blog: Visit my blog (if you have one)");
      addTerminalLine("- contact: How to reach me");
      addTerminalLine("- clear: Clear the terminal");
      break;
    case 'resume':
    case 'about': // Combine resume and about for now
      window.location.href = '/about';
      break;
    case 'blog':
      addTerminalLine("Navigating to blog...");
      // window.location.href = '/posts'; // Or your blog section
      addTerminalLine("Blog feature coming soon!");
      break;
    case 'contact':
      addTerminalLine("Contact me:");
      addTerminalLine("Email: your.email@example.com"); // Replace with your email
      addTerminalLine("LinkedIn: linkedin.com/in/yourlinkedin"); // Replace
      addTerminalLine("GitHub: github.com/yourgithub"); // Replace
      break;
    case 'clear':
      // Clear previous commands and output, keep initial messages and input
      const initialMessages = [
        "Welcome, [Your Name/Alias].",
        "Type 'help' for a list of commands."
      ];
      // Select all divs except the one containing the input
      const linesToRemove = Array.from(terminal.querySelectorAll('div:not(:last-child)'));
      linesToRemove.forEach(line => terminal.removeChild(line));
      initialMessages.forEach(msg => addTerminalLine(msg));
      break;
    default:
      addTerminalLine(`Unknown command: ${command}. Type 'help' for options.`);
  }
}

inputField.addEventListener('keypress', function(event) {
  if (event.key === 'Enter') {
    const command = inputField.value.trim();
    if (command) {
        processCommand(command);
    }
    inputField.value = '';
    terminal.scrollTop = terminal.scrollHeight; // Scroll to bottom
  }
});

// Initial focus and clear
inputField.focus();
inputField.value = '';