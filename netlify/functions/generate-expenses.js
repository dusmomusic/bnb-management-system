const { exec } = require('child_process');

exports.handler = async function(event, context) {
  return new Promise((resolve, reject) => {
    exec('npm run cron:expenses', (error, stdout, stderr) => {
      if (error) {
        console.error('Error executing script:', stderr);
        return reject({ 
          statusCode: 500, 
          body: JSON.stringify({ 
            error: 'Failed to generate fixed expenses',
            details: stderr
          })
        });
      }
      
      console.log('Fixed expenses generated successfully:', stdout);
      return resolve({
        statusCode: 200,
        body: JSON.stringify({ 
          message: "Fixed expenses generated successfully",
          details: stdout
        })
      });
    });
  });
}; 