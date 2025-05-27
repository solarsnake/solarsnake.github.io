document.addEventListener('DOMContentLoaded', () => {
  const outputElement = document.getElementById('terminal-output');
  const inputElement = document.getElementById('terminal-input');

  // Check if essential terminal elements exist
  if (!outputElement || !inputElement) {
      console.error('Terminal elements (output or input) not found in HTML.');
      // Attempt to display an error on the page if outputElement exists
      if (outputElement) {
          const errorLine = document.createElement('div');
          errorLine.textContent = "Error: Terminal components failed to load. Check console.";
          errorLine.style.color = "red"; // Make error prominent
          outputElement.appendChild(errorLine);
      }
      return; // Stop script execution if elements are missing
  }

  function addOutputLine(text, isCommandOutput = false, promptSymbol = '>') {
      const line = document.createElement('div');
      if (isCommandOutput) {
          // For commands typed by user, show prompt then command
          line.textContent = `${promptSymbol} ${text}`;
      } else {
          // For system messages or command results
          line.textContent = text;
      }
      outputElement.appendChild(line);
      // Ensure the terminal scrolls to the latest output
      outputElement.scrollTop = outputElement.scrollHeight;
  }

  function processCommand(command) {
      const lowerCommand = command.toLowerCase().trim();
      addOutputLine(command, true); // Display the command the user typed

      switch (lowerCommand) {
          case 'help':
              addOutputLine("Available commands:");
              addOutputLine("  resume   - View my resume / about page");
              addOutputLine("  contact  - Display contact information");
              addOutputLine("  theme    - Info about the site theme");
              addOutputLine("  clear    - Clear the terminal screen");
              break;
          case 'resume':
          case 'about':
              addOutputLine("Loading resume/about page...");
              window.location.href = '/resume/'; // This will navigate to content/resume.md
              break;
          case 'contact':
              addOutputLine("Contact Information:");
              addOutputLine("  Email    : your-email@example.com (Replace this!)"); // TODO: Replace
              addOutputLine("  LinkedIn : linkedin.com/in/yourprofile (Replace this!)"); // TODO: Replace
              addOutputLine("  GitHub   : github.com/solarsnake (Replace this!)"); // TODO: Replace
              break;
          case 'theme':
              addOutputLine("Site Theme: Matrix-inspired Terminal");
              addOutputLine("Built with Hugo and custom JavaScript.");
              break;
          case 'clear':
              outputElement.innerHTML = ''; // Clear all previous output
              addInitialMessages(); // Re-add initial messages
              break;
          default:
              if (lowerCommand) { // Avoid showing error for empty enter presses
                  addOutputLine(`Command not found: '${command}'. Type 'help' for options.`);
              }
      }
  }

  inputElement.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
          const commandText = inputElement.value;
          processCommand(commandText);
          inputElement.value = ''; // Clear input field after command
      }
  });

  function addInitialMessages() {
      addOutputLine("Connection established to SolarSnake's console.");
      addOutputLine("System: Hugo Web Terminal v1.0");
      addOutputLine(`Date: ${new Date().toLocaleDateString()}`);
      addOutputLine("Type 'help' for a list of available commands.");
      addOutputLine("---");
  }

  // Initial setup
  addInitialMessages();
  inputElement.focus(); // Set focus to input field on load
});