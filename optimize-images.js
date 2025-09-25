const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function optimizeImages() {
  const inputDir = 'public/images';
  const outputDir = 'public/optimized';
  
  console.log('🔍 Checking directory:', path.resolve(inputDir));

  if (!fs.existsSync(inputDir)) {
    console.log(`❌ Input directory '${inputDir}' not found`);
    return;
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 Created output directory: ${outputDir}`);
  }

  // Function to recursively find all image files
  function findImageFiles(dir) {
    let imageFiles = [];
    
    function scanDirectory(currentDir) {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else if (stat.isFile() && /\.(jpg|jpeg|png|webp|avif|ico|svg)$/i.test(item)) {
          imageFiles.push({
            fullPath: fullPath,
            relativePath: path.relative(inputDir, fullPath),
            fileName: item
          });
        }
      }
    }
    
    scanDirectory(dir);
    return imageFiles;
  }

  // Find all image files recursively
  const imageFiles = findImageFiles(inputDir);
  
  console.log('📁 Found folders:');
  const folders = fs.readdirSync(inputDir).filter(item => {
    const fullPath = path.join(inputDir, item);
    return fs.statSync(fullPath).isDirectory();
  });
  folders.forEach(folder => console.log('   -', folder));

  if (imageFiles.length === 0) {
    console.log('❌ No image files found in public/images/ or its subfolders');
    console.log('💡 Supported formats: JPG, JPEG, PNG, WEBP, AVIF, ICO, SVG');
    return;
  }

  console.log(`🖼️  Found ${imageFiles.length} images in subfolders`);
  
  let optimizedCount = 0;
  let skippedCount = 0;
  let copiedCount = 0;

  for (const image of imageFiles) {
    const inputPath = image.fullPath;
    const ext = path.extname(image.fileName).toLowerCase();
    
    // Create output path that preserves folder structure
    const outputRelativeDir = path.dirname(image.relativePath);
    const outputFullDir = path.join(outputDir, outputRelativeDir);
    
    // Handle different file types appropriately
    let outputName, outputPath;
    
    if (ext === '.svg' || ext === '.ico') {
      // Copy SVG and ICO files directly (Sharp can't optimize them well)
      outputName = image.fileName;
      outputPath = path.join(outputFullDir, outputName);
    } else {
      // Convert other images to WebP
      outputName = path.parse(image.fileName).name + '.webp';
      outputPath = path.join(outputFullDir, outputName);
    }
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputFullDir)) {
      fs.mkdirSync(outputFullDir, { recursive: true });
    }

    try {
      if (ext === '.svg' || ext === '.ico') {
        // Copy SVG and ICO files directly
        fs.copyFileSync(inputPath, outputPath);
        copiedCount++;
        console.log(`📋 Copied: ${image.relativePath}`);
      } else {
        // Optimize other images to WebP
        console.log(`⚙️  Processing: ${image.relativePath} -> ${path.join(outputRelativeDir, outputName)}`);
        
        await sharp(inputPath)
          .webp({ 
            quality: 80,
            effort: 6 
          })
          .toFile(outputPath);
        
        optimizedCount++;
        console.log(`✅ Optimized: ${image.relativePath}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${image.relativePath}:`, error.message);
      skippedCount++;
    }
  }

  console.log(`🎉 Optimization complete!`);
  console.log(`✅ Optimized: ${optimizedCount} images to WebP`);
  console.log(`📋 Copied: ${copiedCount} SVG/ICO files`);
  console.log(`❌ Skipped: ${skippedCount} images`);
  console.log(`📁 Output location: ${path.resolve(outputDir)}`);
}

optimizeImages();