for classfile in *.class; do
    if [ "$classfile" = "*.class" ]; then
        >&2 echo "no class file"
    else
	classname=${classfile%.*}
       	#Execute fgrep with -q option to not display anything on stdout when the match is found
        if javap -public $classname | fgrep -q 'public static void main(java.lang.String[])'; then
            (/usr/bin/time -v -o ./time.txt java -cp .:/guava-28.2-jre.jar $classname $1 "$@") 
            exit 0;
        fi
    fi
done
