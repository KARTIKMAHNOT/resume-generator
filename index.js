const express = require('express');
const path = require('path');
const app = express();
const latex = require('node-latex');
const { Readable } = require('stream');

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Render pages
app.get('/', (req, res) => {
  res.render("index");
});
app.get('/select', (req, res) => {
  res.render("select");
});
app.get('/information/:id', (req, res) => {
  const id = req.params.id;
  console.log(id);
  res.render("info", { id }); // Pass 'id' to EJS template
});

/**
 * Helper functions to generate LaTeX code for different resume templates.
 */

// Template 1 – expects each multi-entry field as an array (with numeric indexes)
function generateLatex1(data) {
  const { name, phone, email, location, summary, education, experience, skills, projects, certifications } = data;
  let latexCode = `
\\documentclass[10pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=1in]{geometry}
\\usepackage{xcolor}
\\definecolor{primary}{RGB}{25,55,145}
\\usepackage{tabularx}
\\usepackage{fontawesome5}
\\usepackage{lmodern}

\\begin{document}
\\pagestyle{empty}
% Removed custom Helvetica font command to avoid missing TFM files
\\noindent\\colorbox{primary}{\\parbox{\\dimexpr\\textwidth-2\\fboxsep}{\\color{white}\\large\\bfseries ${name}\\ \\faUser\\ \\hfill \\faPhone\\ ${phone}\\ \\faEnvelope\\ ${email}\\ \\faMapMarker\\ ${location}}}

\\vspace{10pt}
\\section*{Summary}
${summary}

\\noindent\\color{primary}\\rule{\\textwidth}{2pt}
`;

  if (experience && experience.length > 0) {
    latexCode += `
\\section*{Experience}
\\begin{tabularx}{\\textwidth}{@{}l X@{}}
`;
    experience.forEach(exp => {
      let bullets = "";
      if (Array.isArray(exp[3])) {
        bullets = exp[3].join(" \\newline ");
      } else {
        bullets = exp[3];
      }
      latexCode += `${exp[0]} & \\textbf{${exp[1]}} \\newline ${exp[2]} \\newline ${bullets} \\\\ \n`;
    });
    latexCode += "\\end{tabularx}\n\\noindent\\color{primary}\\rule{\\textwidth}{2pt}\n";
  }

  if (education && education.length > 0) {
    latexCode += "\\section*{Education}\n";
    education.forEach(edu => {
      latexCode += `${edu[0]} \\hfill ${edu[2]} \\newline ${edu[1]} \\newline \\vspace{5pt}\n`;
    });
  }

  if (skills && skills.length > 0) {
    latexCode += "\\section*{Skills}\n";
    skills.forEach(skill => {
      let bullets = "";
      if (Array.isArray(skill[1])) {
        bullets = skill[1].join(", ");
      } else {
        bullets = skill[1];
      }
      latexCode += `${skill[0]}: ${bullets} \\newline \n`;
    });
  }

  if (projects && projects.length > 0) {
    latexCode += "\\section*{Projects}\n";
    projects.forEach(proj => {
      let bullets = "";
      if (Array.isArray(proj[1])) {
        bullets = proj[1].join(" \\newline ");
      } else {
        bullets = proj[1];
      }
      latexCode += `\\textbf{${proj[0]}} \\newline ${bullets} \\newline \\vspace{5pt}\n`;
    });
  }

  if (certifications && certifications.length > 0) {
    latexCode += "\\section*{Certifications}\n";
    certifications.forEach(cert => {
      latexCode += `${cert[0]} \\hfill ${cert[1]} \\newline \n`;
    });
  }

  latexCode += "\n\\end{document}\n";
  return latexCode;
}

// Template 2 – expects each multi-entry field as an object with specific keys (e.g. skills: { category, items })
function generateLatex2(data) {
  const { name, phone, email, location, summary, education, experience, skills, projects, certifications } = data;
  
  let latexCode = `
\\documentclass[10pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=0.7in]{geometry}
\\usepackage{xcolor}
\\usepackage{lmodern}
\\usepackage{fontawesome5}
\\usepackage{tcolorbox}
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage{array}
\\usepackage{tabularx}

% Define colors
\\definecolor{sidebarbg}{RGB}{255,255,255}
\\definecolor{sidebartxt}{RGB}{0,0,0}
\\definecolor{headerline}{RGB}{0,0,0}

\\titleformat{\\section}{\\large\\bfseries\\color{headerline}}{}{0em}{}[\\titlerule]

\\begin{document}
\\pagestyle{empty}

\\noindent
\\begin{minipage}[t]{0.30\\textwidth}
    \\begin{tcolorbox}[colback=sidebarbg, colframe=sidebarbg, boxrule=0pt, arc=0pt, auto outer arc, width=\\textwidth, halign=center, valign=center]
        {\\Huge\\bfseries \\textcolor{sidebartxt}{${name}}}\\\\[1em]
        {\\large\\textcolor{sidebartxt}{\\faPhone\\ ${phone}\\\\[0.5em]
        \\faEnvelope\\ ${email}\\\\[0.5em]
        \\faMapMarker\\ ${location}}}
    \\end{tcolorbox}
    \\vspace{1em}
    \\section*{\\textcolor{headerline}{Skills}}
    \\vspace{-0.5em}
    \\begin{itemize}[leftmargin=*]
`;
  skills.forEach(skill => {
    let items = Array.isArray(skill.items) ? skill.items.join(", ") : skill.items;
    latexCode += `    \\item \\textbf{${skill.category}}: ${items}\n`;
  });
  latexCode += `
    \\end{itemize}
    \\vspace{1em}
    \\section*{\\textcolor{headerline}{Certifications}}
    \\vspace{-0.5em}
    \\begin{tabular}{@{}l r@{}}
`;
  certifications.forEach(cert => {
    latexCode += `    ${cert.name} & ${cert.year}\\\\[0.5em]\n`;
  });
  latexCode += `
    \\end{tabular}
\\end{minipage}
\\hfill
\\begin{minipage}[t]{0.65\\textwidth}
    \\section*{\\textcolor{headerline}{Summary}}
    ${summary}
    
    \\vspace{1em}
    \\section*{\\textcolor{headerline}{Experience}}
    \\begin{tabular}{@{}p{0.25\\textwidth} p{0.70\\textwidth}@{}}
`;
  experience.forEach(exp => {
    let bullets = Array.isArray(exp.bullets) ? exp.bullets.join(" \\newline ") : exp.bullets;
    latexCode += `    ${exp.period} & \\textbf{${exp.title}} at ${exp.company} \\newline ${bullets} \\\\[1em]\n`;
  });
  latexCode += `
    \\end{tabular}
    
    \\vspace{1em}
    \\section*{\\textcolor{headerline}{Education}}
    \\begin{tabular}{@{}p{0.25\\textwidth} p{0.70\\textwidth}@{}}
`;
  education.forEach(edu => {
    latexCode += `    ${edu.degree} & ${edu.university} \\hfill ${edu.year} \\\\[1em]\n`;
  });
  latexCode += `
    \\end{tabular}
    
    \\vspace{1em}
    \\section*{\\textcolor{headerline}{Projects}}
    \\begin{itemize}[leftmargin=*]
`;
  projects.forEach(proj => {
    let bullets = Array.isArray(proj.bullets) ? proj.bullets.join(" \\newline ") : proj.bullets;
    latexCode += `    \\item \\textbf{${proj.title}} --- ${bullets}\n`;
  });
  latexCode += `
    \\end{itemize}
\\end{minipage}

\\end{document}
`;
  
  return latexCode;
}

// Template 3 – expects a 'title' field and slightly different keys (e.g. experience: { period, title, company, description })
function generateLatex3(data) {
  const { name, title, phone, email, location, summary, experience, education, skills, projects, certifications } = data;
  
  let latexCode = `
\\documentclass[10pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=0.7in]{geometry}
\\usepackage{xcolor}
\\usepackage{lmodern}
\\usepackage{fontawesome5}
\\usepackage{tikz}
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage{tabularx}
\\usepackage{array}

\\definecolor{primary}{RGB}{0,102,204}
\\definecolor{headerbg}{RGB}{40,40,40}
\\definecolor{lightgray}{RGB}{240,240,240}

\\newcommand{\\makeheader}[4]{%
  \\begin{tikzpicture}[remember picture, overlay]
    \\node[anchor=north west, fill=headerbg, inner sep=20pt, minimum width=\\paperwidth, minimum height=3cm] (header) at (current page.north west) {};
    \\node[anchor=center] at (header.center) {%
      \\textcolor{white}{\\Huge\\bfseries #1 \\\\[0.5em]
      \\Large #2 \\quad \\faPhone\\ #3 \\quad \\faEnvelope\\ #4}};
  \\end{tikzpicture}%
}

\\titleformat{\\section}{\\normalfont\\Large\\bfseries\\color{primary}}{}{0em}{}
\\titlespacing*{\\section}{0pt}{1.5ex plus 1ex minus .2ex}{1ex plus .2ex}

\\begin{document}
\\pagestyle{empty}

\\makeheader{${name}}{${title || "Software Engineer"}}{${phone}}{${email}}

\\vspace{4cm}

\\section*{Summary}
${summary}

\\vspace{1em}
\\noindent\\rule{\\textwidth}{0.5pt}

\\section*{Experience}
\\begin{tabularx}{\\textwidth}{@{}l X@{}}
`;
  experience.forEach(exp => {
    latexCode += `${exp.period} & \\textbf{${exp.title}} at ${exp.company} \\\\[0.5em]
  & ${exp.description} \\\\[1em]\n`;
  });
  
  latexCode += `
\\end{tabularx}
\\vspace{1em}
\\noindent\\rule{\\textwidth}{0.5pt}

\\section*{Education}
\\begin{tabularx}{\\textwidth}{@{}l X@{}}
`;
  education.forEach(edu => {
    latexCode += `${edu.period} & ${edu.degree}, ${edu.institution} \\\\[1em]\n`;
  });
  
  latexCode += `
\\end{tabularx}
\\vspace{1em}
\\noindent\\rule{\\textwidth}{0.5pt}

\\section*{Skills}
`;
  skills.forEach(skill => {
    let items = Array.isArray(skill.items) ? skill.items.join(", ") : skill.items;
    latexCode += `\\noindent \\textbf{${skill.category}}: ${items} \\\\ \n`;
  });
  
  latexCode += `
\\vspace{1em}
\\noindent\\rule{\\textwidth}{0.5pt}

\\section*{Projects}
\\begin{itemize}[leftmargin=*]
`;
  projects.forEach(proj => {
    latexCode += `\\item \\textbf{${proj.title}} --- ${proj.description}\n`;
  });
  
  latexCode += `
\\end{itemize}
\\vspace{1em}
\\noindent\\rule{\\textwidth}{0.5pt}

\\section*{Certifications}
\\begin{tabular}{@{}l r@{}}
`;
  certifications.forEach(cert => {
    latexCode += `${cert.name} & ${cert.year} \\\\ \n`;
  });
  
  latexCode += `
\\end{tabular}

\\end{document}
`;
  
  return latexCode;
}

// Route to handle the form submission and generate dynamic LaTeX code
app.post('/generate', (req, res) => {
  const { name, phone, email, location, summary, id } = req.body;
  
  // Ensure multi-entry fields are arrays
  const education = Array.isArray(req.body.education) ? req.body.education : [req.body.education];
  const experience = Array.isArray(req.body.experience) ? req.body.experience : [req.body.experience];
  const skills = Array.isArray(req.body.skills) ? req.body.skills : [req.body.skills];
  const projects = Array.isArray(req.body.projects) ? req.body.projects : [req.body.projects];
  const certifications = Array.isArray(req.body.certifications) ? req.body.certifications : [req.body.certifications];

  let resumeData;
  if (id == 1) {
    // For Template 1, map data to arrays as expected by generateLatex1
    resumeData = {
      name,
      phone,
      email,
      location,
      summary,
      education: education.map(edu => [edu.degree, edu.university, edu.year]),
      experience: experience.map(exp => [exp.period, exp.title, exp.company, exp.bullets]),
      skills: skills.map(skill => [skill.category, skill.bullets]),
      projects: projects.map(proj => [proj.title, proj.bullets]),
      certifications: certifications.map(cert => [cert.name, cert.year])
    };
  } else if (id == 2) {
    // For Template 2, use the data as provided (each object must have the required keys)
    resumeData = {
      name,
      phone,
      email,
      location,
      summary,
      education,       // Expected: { degree, university, year }
      experience,      // Expected: { period, title, company, bullets }
      skills,          // Expected: { category, items }
      projects,        // Expected: { title, bullets }
      certifications   // Expected: { name, year }
    };
  } else {
    // For Template 3, include an additional 'title' field and expect corresponding keys
    resumeData = {
      name,
      title: req.body.title,  // e.g., "Software Engineer"
      phone,
      email,
      location,
      summary,
      education,       // Expected: { period, degree, institution }
      experience,      // Expected: { period, title, company, description }
      skills,          // Expected: { category, items }
      projects,        // Expected: { title, description }
      certifications   // Expected: { name, year }
    };
  }

  // Generate the LaTeX code based on the selected template
  let latexCode;
  if (id == 1) {
    latexCode = generateLatex1(resumeData);
  } else if (id == 2) {
    latexCode = generateLatex2(resumeData);
  } else {
    latexCode = generateLatex3(resumeData);
  }

  // Set response headers for PDF download.
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="resume.pdf"');

  // Create a new Readable stream and push the LaTeX code into it.
  const stream = new Readable();
  stream.push(latexCode);
  stream.push(null);

  // Compile the LaTeX code into a PDF using node-latex.
  const pdfStream = latex(stream);
  
  pdfStream.on('error', err => {
    console.error('Error generating PDF:', err);
    res.status(500).send('Error generating PDF');
  });
  
  pdfStream.pipe(res);
  console.log('Resume generated for template id:', id);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
