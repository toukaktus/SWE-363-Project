const sqlite3 = require('sqlite3')
const sqlite = require('sqlite')
const getDbConnection = async () => {
    return await sqlite.open({
        filename: 'swe-363-proj.db',
        driver: sqlite3.Database
    })
}

async function signUp(firstName, lastName, email, username, password){
  const db = await getDbConnection();
  db.run(`INSERT INTO Users (firstName, lastName, email, username, password) VALUES (?, ?, ?, ?, ?)`,
    [firstName, lastName, email, username, password],
    function (err) {
      if (err) {
        res.status(400).json({ error: err.message });
      } else {
        //res.json({ id: this.lastID });
        console.log('User has been added succesfully. with ID : ', this.lastID)
      }
    }
  );
}
  //LogIn
async function getUserInfo(username) {
  const db = await getDbConnection();
  let User1 = await db.get(`SELECT * FROM Users WHERE userName = '${username}'`);
  let userNotes = await db.get(`SELECT * FROM Notes WHERE author = '${username}'`);
  const values = {
      user: User1,
      userNotes : userNotes
      }
  await db.close()
  return values
}

async function getAdminInfo(username) {
  const db = await getDbConnection();
  let Admin = await db.get(`SELECT * FROM Admins WHERE userName = '${username}'`);
  await db.close();
  return Admin
}

// define a function that retrieves the courses data
async function getCoursesData() {
    const db = await getDbConnection();
    // query to retrieve course name and number of notes for each course
    const query = `
  SELECT Courses.name AS course_name, COUNT(Notes.id) AS num_notes
  FROM Courses
  LEFT JOIN Notes ON Courses.id = Notes.course_id
  GROUP BY Courses.id;
`;
    // execute query and retrieve results
    return db.all(query, [], (err,rows) => {return rows})

    // return new Promise((resolve, reject) => {
    //   db.all(query, [], (err, rows) => {
    //     if (err) {
    //       console.error(err.message);
    //       reject(err);
    //     } else {
    //       console.log(rows);
    //       return rows;
    //     }
    //   });
    // });
  };

  async function getCourses() {
    const db = await getDbConnection();
    const query = 'SELECT * FROM Courses'
    const courses = await db.all(query);
    // console.log(courses);
    return courses;
  }

  // Follow how this function is structred as it doesn't make the server gets into an endless loop!
  async function getCourseNotes(courseName) {
    const db = await getDbConnection();
    const query = `SELECT Notes.dateCreated AS note_date, Notes.author AS note_author, Notes.rating AS note_rating, Notes.fileName AS note_fileName, Notes.title AS note_title
      FROM Notes 
      WHERE course_id = (SELECT id FROM Courses WHERE name = ?)`;
    const notes = await db.all(query, [courseName]);
    await db.close();
    return notes;
  }

  async function getAllNotes(){
    const db = await getDbConnection();
    const query = `SELECT Notes.fileName, Courses.name AS courseName, Notes.dateCreated AS date,
                     Notes.author, Notes.rating 
                    FROM Notes JOIN Courses ON Notes.course_id = Courses.id`
    const notes = await db.all(query, (err, rows) => {
      if (err) {
        console.error(err.message);
      } else {
        console.log(rows);
      }
    });
    
    console.log(notes);
    return notes
  }
  async function getUserNotes(username) {
    const db = await getDbConnection();
    const query = `SELECT COUNT(*) AS num_notes, Courses.name AS course_name, 
                  Notes.dateCreated AS note_date, Notes.rating AS note_rating,
                  Notes.fileName AS note_fileName, Notes.title AS note_title
                   FROM Notes 
                   JOIN Courses ON Notes.course_id = Courses.id
                   WHERE author = ?
                   GROUP BY author, course_name, note_date, note_rating, note_fileName, note_title;`;
    const notes = await db.all(query, [username]);
    await db.close();
    return notes.map(note => ({ 
      notes_num: note.num_notes,
      note_course: note.course_name,
      note_date: note.note_date,
      note_rating: note.note_rating,
      note_fileName: note.note_fileName,
      note_title : note.note_title
    }));
}

async function addNote(course,title,date,author,rating,description,fileName) {
  const db = await getDbConnection();
  const insertQuery = `INSERT INTO Notes(course_id, title, dateCreated, author, rating, description, fileName) 
                         VALUES (?, ?, ?, ?, ?, ?, ?)`;
    await db.run(insertQuery, [course, title, date, author, rating, description, fileName]);
}










  // update eachtime you add a function that will be used elsewhere.
  module.exports = {
    signUp, getAdminInfo, getUserInfo, getUserNotes, getCoursesData, getCourses, getCourseNotes, addNote, getAllNotes
  }
  