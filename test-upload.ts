const sampleScript = `EXT. CITYSCAPE - NIGHT

Gotham City. The City of Tomorrow: stark angles, creeping shadows, dense, crowded, as if hell had erupted through the sidewalks. A dangling fat moon shines overhead.

EXT. GOTHAM SQUARE - NIGHT

PUSHERS wave to HOOKERS. STREET HUSTLERS slap high-fives with three-card monte dealers. They all seem to know each other... with one conspicuous exception:

A TOURIST FAMILY, MOM, DAD, AND LITTLE JIMMY, march warily down the main drag. Just out of a show.`;

async function testUpload() {
  try {
    console.log("Testing script upload...");
    const response = await fetch("http://localhost:3000/api/scripts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Test Document",
        content: sampleScript
      }),
    });
    
    const data = await response.json();
    console.log("Response:", data);
  } catch (error) {
    console.error("Upload failed:", error);
  }
}

testUpload();