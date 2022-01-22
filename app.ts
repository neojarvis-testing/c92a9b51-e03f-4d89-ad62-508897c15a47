import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import * as uuid from 'uuid';

// service

import { MenuItem, FileUpload } from 'primeng/primeng';
import { ActivatedRoute, Router } from '@angular/router';

import * as _ from 'lodash';
import { UploadFileService } from '../../service/upload-file.service';
import { ContentService } from '../../service/content.service';
import { ProjectService } from 'src/app/service/project.service';
import { TestService } from '../../service/test.service';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-add-project',
    templateUrl: './project-add.component.html',
    styleUrls: ['./project-add.component.css'],
})
export class ProjectAddComponent implements OnInit, OnDestroy {
    // for edit in question
    data: any;
    a;
    b;
    cbid;
    gid;
    title;
    // type
    // qtype: any[];
    // qsubtype: any[];
    openDialog = false;

    // form
    // qTypeForm: FormGroup;

    displayAddQuestion = false;
    has_auto_evaluation = false;
    is_allowed_stack = false;
    helpMessage = [];

    // split button
    saveitems: MenuItem[];

    // growl msg
    qerrorMsg = [];
    qerrorMsgDisplay = false;

    // save buttons
    saveFlag;
    saveandcloseFlag;
    saveandcreatenewFlag;
    school_id: any;

    // temp ids
    tempid;
    updateFlag: any = false;
    qarray: any = [];
    cb_created_by: any;
    userData = JSON.parse(localStorage.getItem('token'));
    contentUpdate;
    addcontent;
    qContentForm: FormGroup = new FormGroup({
        name: new FormControl(null, Validators.required),
        project_data: new FormControl(null, Validators.required),
        tags: new FormControl([]),
        themes: new FormControl([]),
        image: new FormControl('', Validators.required),
        node_pool: new FormControl(null, Validators.required),
        sub_topic_id: new FormControl(null),
    });
    qSubTopicArray: any;
    imagesArray: any = environment.dockerImages;
    qtopicid: any;
    qsubtopicid: any;
    qtopic: any;
    qsubject: any;
    qsubjectid: any;
    nodePoolArray: any;
    selectedEvaluationTypes: any = [];
    configArray: any = [];
    sampleZipLink = '';
    projectOpen: NodeJS.Timer;
    showLoader = false;


    evaluationTypes: any = [
        {
            label: 'Maven Junit',
            value: 'Maven Junit',
        },
        {
            label: 'Puppeteer',
            value: 'Puppeteer',
        },
        {
            label: 'Karma',
            value: 'Karma',
        },
        {
            label: 'Screenshot Match',
            value: 'Screenshot Match',
        },
        {
            label: 'React Jest',
            value: 'React Jest'
        },
        {
            label: 'Shell',
            value: 'Shell',
        },
        {
            label: 'NUnit',
            value: 'NUnit'
        }
    ];
    config: any = [];

    allowedStacks = ['Node.js Mongo', 'Node.js Mysql', 'Java Mongo', 'Java Mysql', 'Java Cassandra', 'Java Oracle', 'Python', 'DotNET', 'Selenium', 'Java Mysql Selenium'];

    notProgrammingaceOptions: any = {
        printMargin: false,
        showLineNumbers: true,
        autoScrollEditorIntoView: true,
        minLines: undefined,
        maxLines: Infinity,
        highlightActiveLine: false,
        highlightGutterLine: false,
        showPrintMargin: false,
    };
    notProgrammingaceTheme = 'tomorrow_night';
    aceCode = 'json';
    uploadedFiles: any[] = [];
    @ViewChild('uploadFile') uploadFile: FileUpload;

    ngOnInit() {
        this.config = JSON.stringify(this.config, null, 2);
        this.showDialog();
        this.getSubTopic();
        window.scrollTo(0, 0);
        // split button
        this.saveitems = [];
        this.saveitems.push({
            label: 'Save and Close',
            command: () => {
                this.saveAndClose();
            },
        });

        this.projectService.getalldockerimage().subscribe((res: any) => {
            this.imagesArray = res.map((img) => {
                return { label: img.name, value: img.id };
            });
            this.handleStackChange(true);
        });

        this.projectService.getallnodepools().subscribe((res: any) => {
            this.nodePoolArray = res.map((img) => {
                return { label: img.name, value: img.id };
            });
        });

        // type of the form
        // this.qTypeForm = new FormGroup({
        //     qtype: new FormControl(null),
        //     qsubtype: new FormControl(null),
        // });
        this.projectService.qData.subscribe(async (qdata: any) => {
            // question sub type
            // this.qsubtype = [
            //     { label: 'PDF', value: 'pdf' },
            //     { label: 'Word', value: 'word' },
            //     { label: 'Excel', value: 'excel' },
            // ];

            // question type
            // this.qtype = [
            //     { label: 'Document', value: 'document' },
            //     { label: 'Text/URL', value: 'text' },
            //     { label: 'Media', value: 'media' },
            // ];
            if (!qdata || qdata === '') {
                this.router.navigate(['/school/project-bank']);
                return;
            } else {
                this.data = JSON.parse(qdata);
                if (this.data.visibility) {
                    this.cbid = this.data.cb_id || this.data.pb_id;
                    this.cb_created_by = this.data.user_id;
                    this.data = 'new';
                    this.title = 'Add Project';
                } else {
                    this.cbid = this.data.pb_id;
                    this.tempid = this.data.project_id;
                    this.gid = this.data.g_id;
                    this.data.clone ? (this.title = 'Clone Project') : (this.title = 'Edit Project');
                }
                if (this.data === 'new') {
                    // this.qTypeForm.get('qtype').setValue(this.qtype[0].value);
                    // this.qTypeForm.get('qsubtype').setValue(this.qsubtype[0].value);
                    // this.ContentService.sendTypeNsubType({
                    //     type: 'document',
                    //     sub_type: 'pdf',
                    // });
                } else {
                    this.qContentForm.get('name').setValue(this.data.name);
                    this.qContentForm.get('tags').setValue(this.data.tags && this.data.tags.map((t) => t.name));
                    this.qContentForm.get('themes').setValue(this.data.themes);
                    this.qContentForm.get('project_data').setValue(this.data.project_data);
                    this.qContentForm.get('image').setValue(this.data.image);
                    this.qContentForm.get('node_pool').setValue(this.data.node_pool);
                    if (this.data.has_auto_evaluation) {
                        this.has_auto_evaluation = true;
                    } else {
                        this.has_auto_evaluation = false;
                    }
                    if (this.data.config) {
                        this.config = JSON.stringify(this.data.config, null, 2);
                    }
                    if (this.data.evaluation_type) {
                        this.selectedEvaluationTypes = this.data.evaluation_type;
                    }

                    if (this.data.boilerPlate) {
                        this.uploadedFiles = [
                            {
                                source: this.data.boilerPlate.url,
                                file: this.data.boilerPlate.file,
                                type: this.data.boilerPlate.type,
                                size: this.data.boilerPlate.size,
                            },
                        ];
                    } else {
                        this.uploadedFiles = [];
                    }

                    await this.getSubTopic();
                    this.qContentForm.get('sub_topic_id').setValue([this.data.topic_id, this.data.sub_topic_id]);
                    this.getTopicSubject([this.data.topic_id, this.data.sub_topic_id]);
                }
            }
        });
        this.school_id = JSON.parse(localStorage.getItem('token')).school_branch_department_users[0].school_id;
    }

    selectConfig() {
        this.configArray = [];
        if (this.selectedEvaluationTypes.includes('Maven Junit')) {
            this.configArray.push({
                evaluation_type: 'Maven Junit',
                testcases: [
                    {
                        name: 'test_case1',
                        weightage: 0.1,
                    },
                    {
                        name: 'test_case2',
                        weightage: 0.1,
                    },
                ],
                testcase_run_command: 'sh /home/coder/project/workspace/junit/junit.sh',
                testcase_path: '/home/coder/project/workspace/junit',
            });
        }
        if (this.selectedEvaluationTypes.includes('Puppeteer')) {
            this.configArray.push({
                evaluation_type: 'Puppeteer',
                testcases: [
                    {
                        name: 'test_case3',
                        weightage: 0.1,
                    },
                    {
                        name: 'test_case4',
                        weightage: 0.1,
                    },
                ],
                testcase_run_command: 'node /home/coder/project/workspace/puppeteer/test.js',
                testcase_path: '/home/coder/project/workspace/puppeteer',
            });
        }
        if (this.selectedEvaluationTypes.includes('Karma')) {
            this.configArray.push({
                evaluation_type: 'Karma',
                testcases: [
                    {
                        name: 'test_case5',
                        weightage: 0.1,
                    },
                    {
                        name: 'test_case6',
                        weightage: 0.1,
                    },
                ],
                testcase_run_command: 'sh /home/coder/project/workspace/karma/karma.sh',
                testcase_path: '/home/coder/project/workspace/karma',
            });
        }
        if (this.selectedEvaluationTypes.includes('Screenshot Match')) {
            this.configArray.push({
                evaluation_type: 'Screenshot Match',
                testcases: [
                    {
                        name: 'test_case7',
                        weightage: 0.1,
                    },
                    {
                        name: 'test_case8',
                        weightage: 0.1,
                    },
                ],
                testcase_run_command: 'node /home/coder/project/workspace/screenshots/test.js',
                testcase_path: '/home/coder/project/workspace/screenshots',
            });
        }
        if (this.selectedEvaluationTypes.includes('React Jest')) {
            this.configArray.push({
                evaluation_type: 'React Jest',
                testcases: [
                    {
                        name: 'test_case9',
                        weightage: 0.1,
                    },
                    {
                        name: 'test_case10',
                        weightage: 0.1,
                    },
                ],
                testcase_run_command: 'sh /home/coder/project/workspace/react/react.sh',
                testcase_path: '/home/coder/project/workspace/react',
            });
        }
        if (this.selectedEvaluationTypes.includes('Shell')) {
            this.configArray.push({
                evaluation_type: 'Shell',
                testcases: [
                    {
                        name: 'test_case11',
                        weightage: 0.1,
                    },
                    {
                        name: 'test_case12',
                        weightage: 0.1,
                    },
                ],
                testcase_run_command: 'sh /home/coder/project/workspace/shell/run.sh',
                testcase_path: '/home/coder/project/workspace/shell',
            });
        }
        if (this.selectedEvaluationTypes.includes('NUnit')) {
            this.configArray.push({
                evaluation_type: 'NUnit',
                testcases: [
                    {
                        name: 'test_case13',
                        weightage: 0.1,
                    },
                    {
                        name: 'test_case14',
                        weightage: 0.1,
                    },
                ],
                testcase_run_command: 'sh /home/coder/project/workspace/nunit/run.sh',
                testcase_path: '/home/coder/project/workspace/nunit',
            });
        }

        this.config = JSON.stringify(this.configArray, null, 2);
    }

    constructor(
        private Location: Location,
        public router: Router,
        public ActivatedRoute: ActivatedRoute,
        public UploadFileService: UploadFileService,
        public ContentService: ContentService,
        public projectService: ProjectService,
        public testService: TestService,
    ) {
        if (!JSON.parse(localStorage.getItem('token')).name) {
            this.router.navigate(['/settings/users']);
        }
        const apiUrl = environment.HOST.link;
        if (apiUrl.includes('.io')) {
            this.sampleZipLink = 'https://s3.amazonaws.com/exams-media/assets/project-zip-upload.zip';
        } else {
            this.sampleZipLink = 'https://s3.amazonaws.com/exams-media-stage/assets/project-zip-upload.zip';
        }

        this.ContentService.listenChild().subscribe((m: any) => {
            if (m === 'save_close_mcq_single') {
                this.qcloseModal();
            }
        });
    }

    showDialog() {
        this.displayAddQuestion = true;
    }

    qcloseModal() {
        this.Location.back();
    }

    save() {
        this.saveFlag = true;
        this.saveandcreatenewFlag = false;
        this.submissionContent();
    }

    saveAndClose() {
        this.saveandcloseFlag = true;
        this.saveFlag = false;
        this.submissionContent();
    }

    saveAndCreateNew() {
        this.saveandcreatenewFlag = true;
        this.saveFlag = false;
        this.submissionContent();
    }

    async submissionContent() {
        this.showLoader = true;
        let isValid: any = true;
        let payload: any;
        this.qContentForm.get('name').markAsTouched();
        this.qContentForm.get('project_data').markAsTouched();
        this.qContentForm.get('image').markAsTouched();
        this.qContentForm.get('node_pool').markAsTouched();
        this.qContentForm.get('tags').markAsTouched();
        this.qContentForm.get('themes').markAsTouched();
        this.qContentForm.get('sub_topic_id').markAsTouched();
        if (this.qContentForm.valid) {
            payload = this.qContentForm.value;
            payload.topic_id = this.qtopicid;
            payload.subject_id = this.qsubjectid;
            payload.sub_topic_id = this.qsubtopicid;
            payload.mainDepartmentUser = this.userData.mainDepartmentUser;
            payload.user_id = this.userData.user_id;
            payload.has_auto_evaluation = this.has_auto_evaluation;
            if (payload.has_auto_evaluation) {
                payload.evaluation_type = this.selectedEvaluationTypes;
                try {
                    payload.config = JSON.parse(this.config);
                    if (!payload.config) {
                        isValid = false;
                        this.showErrorGrowl(
                            'Auto Evaluation Config is required',
                            'Auto Evaluation config is not present',
                        );
                    } else if (
                        payload.config &&
                        payload.config.length &&
                        this.selectedEvaluationTypes.length === payload.config.length
                    ) {
                        let flag = false;
                        let total: any = 0;
                        for (const eachconf of payload.config) {
                            if (eachconf.evaluation_type === 'Puppeteer' || eachconf.evaluation_type === "Shell") {
                                if (
                                    !eachconf.testcase_path ||
                                    !eachconf.testcase_run_command ||
                                    !eachconf.testcases ||
                                    eachconf.testcases.length <= 0
                                ) {
                                    flag = true;
                                }
                            } else if (eachconf.evaluation_type === 'Maven Junit' || eachconf.evaluation_type === 'NUnit') {
                                if (
                                    !eachconf.testcase_run_command ||
                                    !eachconf.testcases ||
                                    eachconf.testcases.length <= 0
                                ) {
                                    flag = true;
                                }
                            }
                            if (eachconf.testcases && eachconf.testcases.length) {
                                let tempsum = 0.0;
                                for ( const tcase of eachconf.testcases) {
                                    tempsum = tempsum + tcase.weightage;
                                }
                                total = total + tempsum;
                                total = total.toFixed(4);
                                total = Number(total);
                            }
                        }
                        if (total !== 1) {
                            isValid = false;
                            this.showErrorGrowl(
                                'Auto Evaluation Config is incorrect',
                                'Sum of testcase weightage should be equal to 1',
                            );
                        }
                        if (flag) {
                            isValid = false;
                            this.showErrorGrowl(
                                'Auto Evaluation Config is incorrect',
                                'Check if testcase_path, testcase_run_command and testcases are present',
                            );
                        }
                    } else {
                        isValid = false;
                        this.showErrorGrowl(
                            'Auto Evaluation Config is required',
                            'Auto Evaluation config is not present for one or more evaluation types',
                        );
                    }
                } catch (error) {
                    if (error) {
                        isValid = false;
                        this.showErrorGrowl(
                            'Auto Evaluation Config is incorrect',
                            'Please check the auto evaluation config for errors',
                        );
                    }
                }
                if (this.uploadedFiles && this.uploadedFiles.length) {
                    if (this.uploadedFiles[0].source && this.uploadedFiles[0].source.includes('project_starters')) {
                        payload.boilerPlate = this.data.boilerPlate;
                    } else {
                        const blobData = this.uploadedFiles[0].file;
                        const starterName: any = this.uploadedFiles[0].file.name;
                        const randomString = uuid.v4();
                        const pay: any = {
                            file_name: 'project_starters/' + this.school_id + '/' + randomString + '/' + starterName,
                            type: this.uploadedFiles[0].type,
                        };
                        payload.boilerPlate = await this.fleUploadSync(pay, blobData, starterName);
                    }
                } else {
                    isValid = false;
                    this.showErrorGrowl('Test cases not present', 'Please upload a zip file contining the test cases');
                }
            } else {
                payload.config = null;
                payload.boilerPlate = null;
                payload.evaluation_type = null;
            }

            payload.project_data = (await this.uploadImagesIninnerHTML('project_data', payload.project_data)).data;
        } else {
            isValid = false;
            this.qerrorMsg = [];
            this.qerrorMsg.push({
                severity: 'error',
                summary: 'Enter all required values',
                detail: 'Validation Failed',
            });
            this.qerrorMsgDisplay = true;
            setTimeout(() => {
                this.qerrorMsg = [];
                this.qerrorMsgDisplay = false;
            }, 3000);
        }

        if (isValid) {
            if (this.data.project_id) {
                payload.project_id = this.data.project_id;
                this.projectService.projectUpdate(payload).subscribe(
                    (res) => {
                        this.qerrorMsg.pop();
                        this.qerrorMsg.push({
                            severity: 'success',
                            summary: 'Success!',
                            detail: 'Project successfully updated',
                        });
                        setTimeout(() => {
                            this.qerrorMsg = [];
                            this.qerrorMsgDisplay = false;
                            this.router.navigate(['/school/project-bank/project-list']);
                            this.ContentService.callChild('stop_loader');
                        }, 3000);
                    },
                    () => {
                        this.qerrorMsg.pop();
                        this.qerrorMsg.push({
                            severity: 'error',
                            summary: 'Something went wrong',
                            detail: 'Could not update',
                        });
                        this.ContentService.callChild('upload-failed');
                    },
                );
                this.qerrorMsgDisplay = true;
                setTimeout(() => {
                    this.qerrorMsgDisplay = false;
                }, 3000);
            } else {
                payload.pb_id = this.cbid;
                this.projectService.addProject(payload).subscribe((res) => {
                    if (res.data.message === 'you dont have permission') {
                        this.qerrorMsgDisplay = true;
                        this.qerrorMsg.pop();
                        this.qerrorMsg.push({
                            severity: 'error',
                            summary: 'Failed!',
                            detail: 'Permission Denied',
                        });
                        setTimeout(() => {
                            this.qerrorMsg = [];
                            this.qerrorMsgDisplay = false;
                            this.router.navigate(['/school/project-bank/project-list']);
                        }, 3000);
                    } else {
                        this.qerrorMsgDisplay = true;
                        this.qerrorMsg.pop();
                        this.qerrorMsg.push({
                            severity: 'success',
                            summary: 'Success!',
                            detail: 'Project successfully created',
                        });
                        setTimeout(() => {
                            this.qerrorMsg = [];
                            this.qerrorMsgDisplay = false;
                        }, 3000);
                        if (this.saveandcreatenewFlag) {
                            this.data = 'new';
                            this.updateFlag = false;
                            this.qContentForm.reset();
                            this.qtopic = '';
                            this.qsubject = '';
                            this.saveandcreatenewFlag = false;
                            this.selectedEvaluationTypes = [];
                            this.configArray = [];
                            this.has_auto_evaluation = false;
                            this.uploadedFiles = [];
                        } else if (this.saveFlag) {
                            this.saveFlag = false;
                            this.updateFlag = true;
                            this.data = { project_id: res.data.project_id };
                            this.ContentService.callChild('stop_loader');
                        } else {
                            this.router.navigate(['/school/project-bank/project-list']);
                        }
                    }
                });
            }
            this.showLoader = false;
        } else {
            this.qerrorMsgDisplay = true;
            setTimeout(() => {
                this.qerrorMsg = [];
                this.qerrorMsgDisplay = false;
            }, 3000);
            this.showLoader = false;
        }
    }

    update() {
        this.submissionContent();
    }
    ngOnDestroy() {
        this.unSubscribe(this.contentUpdate);
        this.unSubscribe(this.addcontent);
    }
    unSubscribe(data) {
        if (data) {
            data.unsubscribe();
        } else {
            return false;
        }
    }

    getSubTopic() {
        return new Promise((resolve) => {
            this.projectService.getAllSubTopic().subscribe((response: any) => {
                this.qSubTopicArray = [];
                for (const o of response.data) {
                    this.qSubTopicArray.push({
                        label: o.topic.name + ' - ' + o.name,
                        value: [o.topic_id, o.sub_topic_id],
                    });
                }
                resolve(true);
            });
        });
    }

    getTopicSubject(ids) {
        this.qtopicid = ids[0];
        this.qsubtopicid = ids[1];
        this.projectService.getTopicSubject(ids[0]).subscribe((response: any) => {
            const val = response;
            this.qtopic = val.data.name;
            this.qsubject = val.data.subject.name;
            this.qsubjectid = val.data.subject.subject_id;
        });
    }

    uploadImagesIninnerHTML(what_for, data): Promise<any> {
        return new Promise((resolved, rejected) => {
            const random = Math.floor(Math.random() * 9999999999);
            const school_id = JSON.parse(localStorage.getItem('token')).school_id;
            const path = school_id + '/questions/' + random;
            this.UploadFileService.separateImages(data, path).then((updatedData: any) => {
                resolved({
                    what_for: what_for,
                    data: updatedData,
                });
            });
        });
    }
    onUpload(event) {
        this.uploadedFiles = [];
        for (const file of event.files) {
            this.uploadedFiles.push({
                source: URL.createObjectURL(file),
                file: file,
                type: file.type,
                data: 'input',
                size: (file.size / 1024).toFixed(2),
            });
        }
        if (this.uploadedFiles.length > 0 && this.uploadFile) {
            this.uploadFile.clear();
        }
    }
    removeFile() {
        this.uploadedFiles = [];
    }
    removeUploadedFile() {
        this.uploadedFiles = [];
    }

    fleUploadSync(pay, blobData, starterName) {
        return new Promise((resolved) => {
            this.UploadFileService.getSignedUrl(pay).subscribe((url: any) => {
                if (url) {
                    const json = url;
                    this.UploadFileService.uploadUsingSignedUrl(json.data.url, blobData).subscribe(
                        (r: any) => {
                            if (r && r.status === 200) {
                                const bucket: string = r.url.split('.amazonaws')[0].split('://')[1].split('.')[0];
                                const s3_url = 'https://s3.amazonaws.com/' + bucket + '/' + pay.file_name;
                                resolved({
                                    url: s3_url,
                                    type: pay.type,
                                    file: starterName,
                                    size: (this.uploadedFiles[0].file.size / 1024).toFixed(2),
                                });
                            }
                        },
                        (error) => {
                            resolved({});
                        },
                    );
                }
            });
        });
    }

    handleStackChange(isFirstTime?) {
        if (this.qContentForm && this.qContentForm.get('image') && this.qContentForm.get('image').value) {
            const selected: any = this.imagesArray.find((each: any) => {
                return each.value === this.qContentForm.get('image').value;
            });
            if (selected && selected.label && this.allowedStacks.includes(selected.label)) {
                if (selected.label.includes('Java') || selected.label === 'Selenium') {
                    this.evaluationTypes = [
                        {
                            label: 'Maven Junit',
                            value: 'Maven Junit',
                        },
                        {
                            label: 'Puppeteer',
                            value: 'Puppeteer',
                        },
                        {
                            label: 'Karma',
                            value: 'Karma',
                        },
                        {
                            label: 'Screenshot Match',
                            value: 'Screenshot Match',
                        },
                        {
                            label: 'React Jest',
                            value: 'React Jest',
                        },
                        {
                            label: 'Shell',
                            value: 'Shell',
                        },
                    ];
                } else {
                    this.evaluationTypes = [
                        {
                            label: 'Puppeteer',
                            value: 'Puppeteer',
                        },
                        {
                            label: 'Karma',
                            value: 'Karma',
                        },
                        {
                            label: 'Screenshot Match',
                            value: 'Screenshot Match',
                        },
                        {
                            label: 'React Jest',
                            value: 'React Jest',
                        },
                        {
                            label: 'Shell',
                            value: 'Shell',
                        },
                        {
                            label: 'NUnit',
                            value: 'NUnit',
                        }
                    ];
                }
                this.is_allowed_stack = true;
            } else {
                this.is_allowed_stack = false;
                this.has_auto_evaluation = false;
            }
        } else {
            this.is_allowed_stack = false;
            this.has_auto_evaluation = false;
        }
        if (!isFirstTime) {
            this.selectConfig();
        }
    }

    showVariables(type) {
        this.openDialog = true;
        this.helpMessage = [];
        if (type === 'config') {
            this.helpMessage = [
                ' -------- General guidelines -------- ',
                'For each Evaluation type selected you will have a corresponding json config',
                'The json contains evaluation_type, testcases, testcase_run_command',
                'The testcases should match with the testcase names present in the zip file',
                ' -------- For Maven --------',
                'Do not change the testcase_run_command unless required',
                ' -------- For Puppeteer --------',
                'For Puppeteer projects console the success or failure of the testcase in the following format',
                'console.log("TESTCASE:a1:success"); -- where a1 is the testcase defined in the config',
                ' -------- For Screenshot Match --------',
                'For Screenshot Match write sample puppeteer code which will generate the screenshot with the same name as testcase',
                'The Screenshots should be generated inside screenshots/output folder',
                'https://www.npmjs.com/package/resemblejs is already installed and can be used for screen shot comparison',
                'Console the success or failure of the testcase in the following format',
                'console.log("TESTCASE:a1:success:20"); -- where a1 is the testcase defined in the config',
                '20 in the above console is the optional percentage match of screenshot which will determine the marks percentage',
                ' -------- For Shell --------',
                'For Shell script based evalution the success or failure of the testcase in the following format',
                'echo "TESTCASE:a1:success:20" -- where a1 is the testcase defined in the config',
                '20 in the above statement is the optional percentage match of the test case, which will determine the marks percentage',
                ' -------- For NUnit --------',
                'Do not change the testcase_run_command unless required',
            ];
        } else if (type === 'zipfile') {
            this.helpMessage = [
                ' -------- General guidelines -------- ',
                'Download the sample zip file for reference',
                'https://example.com  in code will be replaced by URL of 8080 port',
                'https://api.example.com in code will be replaced by URL of 8081 port',
                'The /application/src/test , karma and puppeteer folders will be readonly for the student',
                ' -------- For Maven Junit --------',
                'For Maven create a directory named junit and add your test case java code inside',
                'Add a shell script that will copy the test cases to required folder and run mvn test',
                'refer sample zip file for sample code',
                ' -------- For Puppeteer --------',
                'For puppeteer create a directory named puppeteer and add your test case node js code inside',
                ' -------- For karma --------',
                'For karma create a directory named karma and add your test case code inside along with karma config',
                'Add a shell script that will copy the test cases and karma config to respective folders and execute npm test',
                'refer sample zip file for sample code',
                ' -------- For Screenshot Match --------',
                'Place the Screenshots that have to be compared in a folder called screenshots',
                ' -------- For React Jest --------',
                'For React create a directory named react and add the setupTests.js',
                'Create a sub folder tests and add your test case code here',
                'Add a shell script that will copy the test cases and setupTests.js to respective folders and execute npm test',
                'refer sample zip file for sample code',
                ' -------- For Shell --------',
                'For Shell create a directory named shell and add the run.sh',
                'Create a sub folder tests and add your test case code here',
                'refer sample zip file for sample code',
                ' -------- For NUnit --------',
                'For NUnit create a directory named nunit and add the run.sh',
                'Add the script that will copy the test cases to required folder and run mvn test in run.sh',
                'refer sample zip file for sample code',
            ];
        }
    }

    showErrorGrowl(summarymessage, detailmessage) {
        this.qerrorMsg = [];
        this.qerrorMsg.push({
            severity: 'error',
            summary: summarymessage,
            detail: detailmessage,
        });
    }

    openProject(data) {
        this.showLoader = true;
        this.testService
            .createInstance(
                `${data.user_id.replace(/-/g, '').replace(/\d+/g, '')}` +
                    `${data.c_id.replace(/-/g, '').replace(/\d+/g, '')}` +
                    `${data.project_id.replace(/-/g, '').replace(/\d+/g, '')}`,
                null,
                data.project_id,
                data.course_id,
            )
            .subscribe((res: any) => {
                this.qerrorMsg = [];
                this.qerrorMsgDisplay = true;
                this.qerrorMsg.push({
                    severity: 'success',
                    summary: 'Instance Initialized',
                    detail: 'Opening Project',
                });
                setTimeout(() => {
                    this.qerrorMsgDisplay = false;
                    this.qerrorMsg.pop();
                }, 3000);
                this.projectOpen = setTimeout(() => {
                    this.showLoader = undefined;
                    delete data.id;
                    this.router.navigate(['/course/project'], { queryParams: data });
                }, 2 * 1000);
            });
    }
}
