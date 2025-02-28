// Script Inspector Tool
// This script is designed to analyze the page for potential script conflicts

(function() {
  console.log('Script Inspector starting...');
  
  // Create UI container
  const container = document.createElement('div');
  container.id = 'script-inspector';
  container.style.position = 'fixed';
  container.style.bottom = '0';
  container.style.right = '0';
  container.style.width = '400px';
  container.style.maxHeight = '50vh';
  container.style.backgroundColor = '#f0f0f0';
  container.style.border = '1px solid #ccc';
  container.style.borderRadius = '5px 0 0 0';
  container.style.padding = '10px';
  container.style.zIndex = '9999';
  container.style.overflow = 'auto';
  container.style.fontFamily = 'monospace';
  container.style.fontSize = '12px';
  container.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
  
  // Add header
  const header = document.createElement('div');
  header.style.fontWeight = 'bold';
  header.style.marginBottom = '10px';
  header.style.borderBottom = '1px solid #ccc';
  header.style.paddingBottom = '5px';
  header.innerHTML = 'Script Inspector <button id="close-inspector" style="float:right;background:#f44336;color:white;border:none;border-radius:3px;padding:2px 5px;">Close</button>';
  container.appendChild(header);
  
  // Add content area
  const content = document.createElement('div');
  content.id = 'inspector-content';
  container.appendChild(content);
  
  // Analyze scripts
  function analyzeScripts() {
    const scripts = document.querySelectorAll('script');
    let output = `<p>Found ${scripts.length} script tags:</p><ul>`;
    
    scripts.forEach((script, index) => {
      const src = script.src ? script.src : 'inline script';
      const type = script.type ? script.type : 'default';
      const content = !script.src ? script.innerHTML.substring(0, 50) + '...' : '';
      
      output += `<li style="margin-bottom:5px;padding-bottom:5px;border-bottom:1px dotted #ccc;">
        <strong>#${index + 1}:</strong> 
        <span style="color:${script.src ? 'green' : 'orange'}">${src}</span>
        <br>Type: ${type}
        ${!script.src ? `<br>Content: <code>${content}</code>` : ''}
      </li>`;
    });
    
    output += '</ul>';
    
    // Check for potential conflicts
    output += '<h3>Potential Issues:</h3><ul>';
    
    // Check for multiple React instances
    if (window.React && window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      output += '<li style="color:green">✓ React detected and seems properly initialized</li>';
    } else if (window.React) {
      output += '<li style="color:orange">⚠️ React detected but DevTools hook is missing</li>';
    } else {
      output += '<li style="color:red">✗ React not detected</li>';
    }
    
    // Check for third-party scripts
    const thirdPartyScripts = Array.from(scripts).filter(s => 
      s.src && (
        s.src.includes('cdn.gpteng.co') || 
        s.src.includes('google') || 
        s.src.includes('analytics') ||
        s.src.includes('facebook') ||
        s.src.includes('twitter')
      )
    );
    
    if (thirdPartyScripts.length > 0) {
      output += '<li style="color:orange">⚠️ Third-party scripts detected that may interfere with React:</li><ul>';
      thirdPartyScripts.forEach(s => {
        output += `<li>${s.src}</li>`;
      });
      output += '</ul>';
    } else {
      output += '<li style="color:green">✓ No potentially conflicting third-party scripts detected</li>';
    }
    
    // Check for script errors
    const errors = window.__scriptErrors || [];
    if (errors.length > 0) {
      output += '<li style="color:red">✗ Script errors detected:</li><ul>';
      errors.forEach(e => {
        output += `<li>${e}</li>`;
      });
      output += '</ul>';
    } else {
      output += '<li style="color:green">✓ No script errors captured</li>';
    }
    
    output += '</ul>';
    
    // Add global variables section
    output += '<h3>Common Framework Globals:</h3><ul>';
    const globals = [
      { name: 'React', exists: typeof React !== 'undefined' },
      { name: 'ReactDOM', exists: typeof ReactDOM !== 'undefined' },
      { name: 'Vue', exists: typeof Vue !== 'undefined' },
      { name: 'jQuery/$', exists: typeof jQuery !== 'undefined' || typeof $ !== 'undefined' },
      { name: 'Angular', exists: typeof angular !== 'undefined' },
      { name: 'window.$RefreshReg$', exists: typeof window.$RefreshReg$ !== 'undefined' },
      { name: 'window.$RefreshSig$', exists: typeof window.$RefreshSig$ !== 'undefined' }
    ];
    
    globals.forEach(g => {
      output += `<li style="color:${g.exists ? 'green' : 'gray'}">${g.exists ? '✓' : '✗'} ${g.name}</li>`;
    });
    
    output += '</ul>';
    
    // Add recommendation section
    output += '<h3>Recommendations:</h3><ul>';
    
    // GPT Engineer script check
    const gptEngScript = Array.from(scripts).find(s => s.src && s.src.includes('cdn.gpteng.co'));
    if (gptEngScript) {
      output += `
        <li style="color:red">
          ⚠️ <strong>GPT Engineer script detected</strong>: This script may be interfering with React. 
          Try temporarily removing or commenting out:
          <pre>${gptEngScript.outerHTML}</pre>
          from your HTML file.
        </li>`;
    }
    
    output += '</ul>';
    
    content.innerHTML = output;
  }
  
  // Capture script errors
  window.__scriptErrors = [];
  const originalErrorHandler = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    window.__scriptErrors.push(`${message} (${source}:${lineno}:${colno})`);
    if (originalErrorHandler) {
      return originalErrorHandler(message, source, lineno, colno, error);
    }
    return false;
  };
  
  // Add to body when DOM is ready
  if (document.body) {
    document.body.appendChild(container);
    analyzeScripts();
    
    // Set up close button
    document.getElementById('close-inspector').addEventListener('click', function() {
      document.body.removeChild(container);
    });
  } else {
    window.addEventListener('DOMContentLoaded', function() {
      document.body.appendChild(container);
      analyzeScripts();
      
      // Set up close button
      document.getElementById('close-inspector').addEventListener('click', function() {
        document.body.removeChild(container);
      });
    });
  }
})(); 