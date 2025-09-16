-- Clean up any existing Tony Stark record first
DELETE FROM public.account 
WHERE account_email = 'tony@starkent.com';

-- 1. Insert Tony Stark into account table
INSERT INTO public.account (
  account_firstname,
  account_lastname,
  account_email,
  account_password
) VALUES (
  'Tony',
  'Stark',
  'tony@starkent.com',
  'Iam1ronM@n'
);

-- 2. Modify Tony Stark's account_type to Admin
UPDATE public.account
SET account_type = 'Admin'
WHERE account_id = (SELECT account_id FROM public.account WHERE account_email = 'tony@starkent.com');

-- 3. Delete Tony Stark record
DELETE FROM public.account
WHERE account_id = (SELECT account_id FROM public.account WHERE account_email = 'tony@starkent.com');

-- 4. Replace 'small interiors' with 'a huge interior' in Hummer description
UPDATE public.inventory
SET inv_description = REPLACE(inv_description, 'small interiors', 'a huge interior')
WHERE inv_make = 'GM' AND inv_model = 'Hummer';

-- 5. Inner Join to get Sport vehicles with classification name
SELECT i.inv_make, i.inv_model, c.classification_name
FROM public.inventory i
INNER JOIN public.classification c ON i.classification_id = c.classification_id
WHERE c.classification_name = 'Sport';

-- 6. Update all image paths to include '/vehicles'
UPDATE public.inventory
SET
  inv_image = REPLACE(inv_image, '/images', '/images/vehicles'),
  inv_thumbnail = REPLACE(inv_thumbnail, '/images', '/images/vehicles');