<?php

function resizeIntoBadge($path)
	{
        $contents = file_get_contents($path);
        $src_img = imagecreatefromstring($contents);
		$square_dimensions = 400;
		// Badges need transparency activated
		imagesavealpha($src_img, true);

		$old_x=imageSX($src_img);
		$old_y=imageSY($src_img);
	
		$ratio1=$old_x/$square_dimensions;
		$ratio2=$old_y/$square_dimensions;
	
		if($ratio1>$ratio2)
		{
			$thumb_w=$square_dimensions;
			$thumb_h=$old_y/$ratio1;
		}
		else    
		{
			$thumb_h=$square_dimensions;
			$thumb_w=$old_x/$ratio2;
		}
		$smaller_image_with_proportions=ImageCreateTrueColor($thumb_w,$thumb_h);
		imagealphablending($smaller_image_with_proportions, false);
		imagesavealpha($smaller_image_with_proportions, true);
		imagecopyresampled($smaller_image_with_proportions,$src_img,0,0,0,0,$thumb_w,$thumb_h,$old_x,$old_y); 
		
		$final_image = imagecreatetruecolor($square_dimensions, $square_dimensions);
		imagealphablending($final_image, false);
		imagesavealpha($final_image, true);
		imagefill($final_image,0,0,0xffffffff);
		if($thumb_w>$thumb_h)
		{
			$dst_x=0;
			$dst_y=($square_dimensions-$thumb_h)/2;
		}
		elseif($thumb_h>$thumb_w)
		{
			$dst_x=($square_dimensions-$thumb_w)/2;
			$dst_y=0;
	
		}
		else
		{
			$dst_x=0;
			$dst_y=0;
		}
	
		$src_x=0;
		$src_y=0;
	
		$src_w=$thumb_w;
		$src_h=$thumb_h;
	
		$pct=100;
		// return $final_image;
		imagecopy($final_image,$smaller_image_with_proportions,$dst_x,$dst_y,$src_x,$src_y,$src_w,$src_h);

		return $final_image;
	}

    // Create image
    $im = resizeIntoBadge("4.png");

    // Output
    header('Content-Type: image/png');

    imagepng($im);
    imagedestroy($im);
?>