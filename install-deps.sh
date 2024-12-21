set -e

if [[ -z $1 ]]; then
  ARCH=`uname -m`
else
  ARCH=$1
fi

# Portable, header-only libraries

