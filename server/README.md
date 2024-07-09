# freemaths
To deploy copy the build directory to here and rename as public (delete or rename public first).

Beware - this path is part of two distinct projects.

The private freemaths project contains everything including server elements.
BEWARE this project should not be made public.

The public server project contains only server elements. It can be used to clone and recreate on new servers.
BEWARE you must create a database and edit the configuration file. Sample files are provided in the private project ajax directory.
Apache must be configured to point to the public folder and to allow .htaccess files (or redirect ajax to ../ajax/ajax.php)

The public directory of this project is completely generated (a copy of the build folder). It is part of the public project but not the private one.
