const axios = require('axios');

async function test() {
  try {
    const res = await axios.get('http://127.0.0.1:8000/api/schedules/options', {
      headers: {
        'Accept': 'application/json',
      }
    });
    console.log("Keys:", Object.keys(res.data));
    console.log("Semesters length:", res.data.semesters?.length);
    console.log("Classes length:", res.data.classes?.length);
  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  }
}

test();
