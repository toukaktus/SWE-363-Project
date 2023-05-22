// import packages
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const nunjucks = require('nunjucks');
const bodyparser = require('body-parser');
// File upload/download stuff
const multer = require('multer');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const fname = file.originalname;
    cb(null, fname)
  }
})
const path = require('path');

const upload = multer({ storage: storage })

const urlencoderparser = bodyparser.urlencoded({extended:false});
const model = require('./models/model');
// import model from './models/model';


// init app and app related stuff
const app = express();
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }))
nunjucks.configure('views', { express: app });
app.set('view engine', 'njk');
// port
const port = 3000;

// start server
app.listen(port, () => {
  console.log('Server listening on http://localhost, port:',port);
});

// routes and stuff
// home page.
app.get('/', async (req, res) => {
    const rows = await model.getCoursesData();
    const coursesTable = `
      <section class="courses_table scrollable">
        ${rows.map(row => `
          <div class="el">
            <a href="/notes/${row.course_name}" class="course_link">
              <div class="notes_num">
                <img src="notes.png" alt="note">
                <label class="num">${row.num_notes}</label>
              </div>
              <div class="text_in">${row.course_name}</div>
            </a>
          </div>
        `).join('')}
      </section>
    `;
    res.render('index', {coursesTable});
});

app.get('/signup', async (req, res) => res.render('signup.html'))
app.get('/Admin/login', async (req, res) => res.render('admin_login.html'))
app.post('/Admin/login',async (req, res) => {
  const matchUser = await model.getAdminInfo(req.body.username)
  try { 
      if (matchUser) {
          const matchPassword = (req.body.password === matchUser.password)
          if (!matchUser || !matchPassword)
              throw 'Invalid Credentials'
          res.redirect(`/Admin/${req.body.username}`)
      }
      else {
          throw 'Invalid Credentials'
      }
  }
  catch (e) {
      //window.alert("Invalid Credentials")
      res.render('admin_login.html', {
         username: req.body.username,
        mode: "invalid Credentials"
      })
  }
          
})
app.get('/Admin/:ADMIN', async (req, res)=> {
  const adminInfo = await model.getAdminInfo(req.params.ADMIN);
  // console.log('server side : ',adminInfo);
  res.render('admin', adminInfo)
})

app.get('/about', async (req, res) => res.render('about.html'))
// login
app.get('/login', async (req, res) => res.render('login.html'))
app.post('/login',async (req, res) => {
  const matchUser = await model.getUserInfo(req.body.username)
  try { 
      if (matchUser.user) {
          const matchPassword = (req.body.password === matchUser.user.password)
          if (!matchUser || !matchPassword)
              throw 'Invalid Credentials'
          res.redirect(`/User/${req.body.username}`)
      }
      else {
          throw 'Invalid Credentials'
      }
  }
  catch (e) {
      //window.alert("Invalid Credentials")
      res.render('login.html', {
         username: req.body.username,
        mode: "invalid Credentials"
      })
  }
          
})
app.get('/User/:NAME', async (req, res) => {
  const usrInfo = await model.getUserInfo(req.params.NAME);
  const notes = await model.getUserNotes(req.params.NAME);
  const user_notes = `
      ${notes.map(note =>`
      <div class="grid-container">
      <div class="grid-item">${note.note_title}</div> 
        <div class="grid-item">${note.note_course}</div>  
        <div class="grid-item">${note.note_date}</div>
        <div class="grid-item">
          <div class="star-ratings">
            <div class="star-ratings-fill" style="width: {{ ${note.note_rating} * 20 }}%"></div>
            <div class="star-ratings-empty"></div>
          </div>
        </div>
        <div class="grid-item">
      <a href="/uploads/${note.note_fileName}">
        <img src="/dl_up.png" alt="note">
      </a>
    </div>
      </div>
      `).join('')}
  `;
  res.render('User', { usrInfo, user_notes, notes })

})
app.get('/User', async (req, res) => {
  res.render('User')
})


app.get('/addNote', async (req, res) => {
  const courses = await model.getCourses();
  //console.log(courses)
  const courses_options = `
  ${courses.map(course =>`
    <option value="${course.id}">${course.name}</option>`).join('')}
  `
  res.render('addNote',{courses_options});
})

app.post('/addNote', upload.single('file'), async (req, res) => {
  try {
    const { title, author, date, description, course } = req.body;
    const fileName = req.file.filename;
    model.addNote(course,title,date,author,0,description,fileName)
    res.redirect('/courses');
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});


app.get('/courses', async (req, res) => {
  const rows = await model.getCoursesData();
  const coursesTable = `
    <div class="courses_table">
      ${rows.map(row => `
        <div class="el">
          <a href="/notes/${row.course_name}" class="course_link">
            <div class="notes_num">
              <img src="notes.png" alt="note">
              <label class="num">${row.num_notes}</label>
            </div>
            <div class="text_in">${row.course_name}</div>
          </a>
        </div>
      `).join('')}
    </div>
  `;
  res.render('courses', { coursesTable });
});
app.get('/notes/', async (req, res) => res.redirect('/courses'))

app.get('/notes/:COURSE', async (req, res) => {
  const course_name = req.params.COURSE;
  const notes = await model.getCourseNotes(course_name);
  const notesTable = `
      ${notes.map(note =>`
      <div class="grid-container">
        <div class="grid-item">${note.note_title}</div> 
        <div class="grid-item">${note.note_date}</div>  
        <div class="grid-item">${note.note_author}</div>
        <div class="grid-item">
          <div class="star-ratings">
            <div class="star-ratings-fill" style="width: {{ ${note.note_rating} * 20 }}%"></div>
            <div class="star-ratings-empty"></div>
          </div>
        </div>
        <div class="grid-item">
      <a href="/uploads/${note.note_fileName}">
        <img src="/dl_up.png" alt="note">
      </a>
    </div>

      </div>
      `).join('')}
  `;   
  // console.log(notesTable);
  res.render('notes.njk', {notesTable , course_name})
})


// close DB connection
app.get('/close', function(req,res){
  db.close((err) => {
    if (err) {
      res.send('There is some error in closing the database');
      return console.error(err.message);
    }
    console.log('Closing the database connection.');
    res.send('Database connection successfully closed');
  });
});

app.get('/uploads/:fileName', (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(__dirname, 'uploads', fileName);
  
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error(err);
      res.status(err.status || 500).send(err.message);
    }
  });
});

app.get('/Admin/edit/allNotes', async (req, res) => { 
  const notes = await model.getAllNotes();
  const notesTable = `
      ${notes.map(note =>`
  <div class="grid-container4">
  <div class="grid-item">
      <a href="/uploads/${note.fileName}">
        <img src="/dl_up.png" alt="note">
      </a>
    </div>
  <div class="grid-item">${note.courseName}</div>
  <div class="grid-item">${note.date}</div>  
  <div class="grid-item">${note.author}</div>
  <div class="grid-item">${note.rating}</div> 
  <div class="grid-item1"><a href="view_notes.html" style="color: red;">Delete</a></div>
  <div class="grid-item1"><a href="/addNote" style="color: blue;">Modify</a></div> 
</div>`).join('')}
`;
  res.render('allNotes', {notesTable})
})

app.post('/signup', urlencoderparser, (req, res) => {
  const { firstName, lastName, email, username, password } = req.body;
   model.signUp(firstName, lastName, email, username, password).then(res.redirect('/'))
});


